#!/usr/bin/env python3
"""Read-only local agent & model discovery for agent-conductor-setup.

This script answers one question: "what agents and models already exist on
this machine?"  It is intentionally conservative, because its output feeds a
configuration step that must never invent capabilities.

Guarantees:

* Read-only.  It never writes, deletes, renames, or chmods anything except the
  optional ``--output`` file the caller explicitly asked for.
* Cursor is never touched.  No ``.cursor`` path is ever stat'd or read, and no
  ``cursor`` binary is ever executed or probed by name.
* No broad home scan.  Only an explicit whitelist of well-known paths is
  visited, one directory level deep, without following symlinks.
* No agent/model lifecycle actions.  It never starts an agent, runs inference,
  pulls/installs a model, or makes a network request.  The single command it
  may run is the verified local catalog command ``dim model list --json``
  (and only for the real home, unless ``--no-cli``).
* No secret extraction.  Only whitelisted scalar model/metadata fields are
  emitted.  ``env`` blocks, auth files, tokens, raw CLI payloads and stderr are
  never emitted.  Values are screened for secret-looking patterns before use.
* No shell.  Every subprocess call uses an argv list with ``shell=False``.

Output schema (JSON): ``schema_version``, ``agents``, ``models``,
``diagnostics``.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import stat
import subprocess
import sys
import time

from discovery_paths import redact_payload, safe_which

try:  # Python >= 3.11
    import tomllib  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback for older runtimes
    tomllib = None  # type: ignore

SCHEMA_VERSION = 1

# CLI binaries we may *detect* on PATH (detection only; we do not run them).
KNOWN_CLIS = ("dim", "codex", "claude", "opencode", "ollama", "lms")

# The only command this script is allowed to execute.
CLI_TIMEOUT_SECONDS = 15

# Per-file size caps.  Anything larger is skipped and reported, never read.
MAX_AGENT_FILE_BYTES = 256 * 1024
MAX_CONFIG_FILE_BYTES = 2 * 1024 * 1024
MAX_CACHE_FILE_BYTES = 32 * 1024 * 1024

MAX_VALUE_LEN = 200

# Evidence tiers.  None of these imply the model is callable.
EVIDENCE_CONFIGURED = "configured"
EVIDENCE_CATALOG = "catalog"
EVIDENCE_LOCAL_INSTALLED = "local-installed"

_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:@/+\-]{0,%d}$" % (MAX_VALUE_LEN - 1))
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._()\[\]:@/+\-]{0,%d}$" % (MAX_VALUE_LEN - 1))
_EFFORT_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_\-]{0,31}$")

_SECRET_PATTERNS = [re.compile(p, re.IGNORECASE) for p in (
    r"eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}",       # JWT
    r"gh[pousr]_[A-Za-z0-9]{16,}",                       # GitHub token
    r"sk-ant-[A-Za-z0-9_\-]{12,}",                       # Anthropic key
    r"sk-[A-Za-z0-9]{16,}",                              # generic sk- key
    r"xox[baprs]-[A-Za-z0-9\-]{10,}",                    # Slack token
    r"(?:AKIA|ASIA)[0-9A-Z]{12,}",                       # AWS access key id
    r"-----BEGIN",
    r"\bBearer\s",
    r"\b(?:token|secret|password|passwd|api[_-]?key|authorization|bearer|credential)s?\b",
)]

# Filenames/dirs that must never be visited.  Defence in depth: nothing below
# ever constructs one of these paths, but a guard keeps future edits honest.
_FORBIDDEN_PATH_PARTS = frozenset({"cursor", ".cursor"})


def looks_like_secret(value: str) -> bool:
    """Return True if the string matches a known secret shape."""
    if not isinstance(value, str):
        return True
    for pat in _SECRET_PATTERNS:
        if pat.search(value):
            return True
    core = re.sub(r"[^A-Za-z0-9+/=_-]", "", value)
    if len(core) >= 40:
        classes = sum(
            1 for c in (r"[a-z]", r"[A-Z]", r"[0-9]") if re.search(c, core)
        )
        if classes >= 3:
            return True
    return False


def clean_id(value) -> "str | None":
    """Validate a model id / provider id / slug.  No whitespace allowed."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or len(value) > MAX_VALUE_LEN:
        return None
    if looks_like_secret(value):
        return None
    if not _ID_RE.match(value):
        return None
    return value


def clean_name(value) -> "str | None":
    """Validate a human display name.  Spaces allowed, controls forbidden."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or len(value) > MAX_VALUE_LEN:
        return None
    if any(ord(ch) < 0x20 or ord(ch) == 0x7F for ch in value):
        return None
    if looks_like_secret(value):
        return None
    if not _NAME_RE.match(value):
        return None
    return value


def clean_effort(value) -> "str | None":
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or looks_like_secret(value):
        return None
    if not _EFFORT_RE.match(value):
        return None
    return value


def is_forbidden(path: str) -> bool:
    parts = set(re.split(r"[\\/]+", path.lower()))
    return bool(parts & _FORBIDDEN_PATH_PARTS)


def _scan_root_for(report: "Report", path: str) -> "str | None":
    """Longest configured scan root (lexical) that contains ``path``."""
    best = None
    for root in report.scan_roots:
        if path == root or path.startswith(root + os.sep):
            if best is None or len(root) > len(best):
                best = root
    return best


def guard_scan_path(report: "Report", path: str, kind: str) -> bool:
    """Check ``path`` is safe to touch *before* any stat/isdir/isfile/scandir.

    Every existing component from a configured scan root (home/project) down to
    ``path`` is examined with ``lstat`` -- which never follows a symlink.  A
    symbolic link anywhere on that chain, or a forbidden name, disqualifies the
    whole path.  The roots are kept lexical (never realpath'd) and are checked
    themselves, so a ``~/.claude`` symlink pointing at ``.cursor``, a symlinked
    ``agents`` directory, or a symlinked scan root is refused rather than
    traversed.  Components that do not exist cannot hide anything below them,
    so the walk stops at the first missing one.  Explicitly requested output
    paths are *not* routed through here.
    """
    if is_forbidden(path):
        report.note_skip("non_regular", path, "forbidden_path")
        return False

    root = _scan_root_for(report, path)
    if root is None:
        report.note_skip("non_regular", path, "outside_scan_roots")
        return False

    rel = os.path.relpath(path, root)
    parts = [] if rel in (".", "") else rel.split(os.sep)
    current = root
    components = [current]
    for part in parts:
        current = os.path.join(current, part)
        components.append(current)

    for component in components:
        try:
            st = os.lstat(component)
        except FileNotFoundError:
            break  # nothing deeper can exist either
        except OSError as exc:
            report.note_parse_error(component, kind, type(exc).__name__)
            return False
        if stat.S_ISLNK(st.st_mode):
            report.note_skip("symlinks", component, "path_component_is_symlink")
            return False
        if is_forbidden(component):
            report.note_skip("non_regular", component, "forbidden_path")
            return False
    return True


class Report:
    """Accumulates the discovery result and human-readable diagnostics."""

    def __init__(self) -> None:
        self.agents = {"installed": [], "defined": []}
        self.models = []
        self._model_keys = set()
        # Lexical roots (home/project) that scanning is confined to.  They are
        # deliberately never realpath'd: the scan guard inspects each component
        # from a root down to the target and refuses symlinks.
        self.scan_roots: "list[str]" = []
        self.secret_rejections = 0
        self.diagnostics = {
            "script": "discover_local.py",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "home": None,
            "project": None,
            "scanned": [],
            "skipped": {"symlinks": [], "oversized": [], "non_regular": []},
            "parse_errors": [],
            "unsupported": [],
            "cli": {
                "enabled": False,
                "ran": False,
                "binary": None,
                "command": None,
                "exit_status": None,
                "json_supported": None,
                "model_count": 0,
                "reason": None,
            },
            "warnings": [],
            "counts": {},
        }

    # -- recording helpers -------------------------------------------------

    def note_scanned(self, kind: str, path: str, status: str) -> None:
        self.diagnostics["scanned"].append(
            {"kind": kind, "path": path, "status": status}
        )

    def note_skip(self, bucket: str, path: str, reason: str) -> None:
        self.diagnostics["skipped"][bucket].append(
            {"path": path, "reason": reason}
        )

    def note_parse_error(self, path: str, kind: str, message: str) -> None:
        # Only the exception *type/message category* is kept; never file bytes.
        self.diagnostics["parse_errors"].append(
            {"path": path, "kind": kind, "error": message}
        )

    def warn(self, message: str) -> None:
        self.diagnostics["warnings"].append(message)

    # -- model accumulation ------------------------------------------------

    def add_model(
        self,
        *,
        mid,
        name=None,
        provider=None,
        evidence,
        source,
        agent=None,
        reasoning_effort=None,
    ) -> bool:
        cid = clean_id(mid)
        if cid is None:
            if mid is not None:
                self.secret_rejections += 1
            return False
        cname = clean_name(name) if name is not None else None
        cprovider = clean_id(provider) if provider is not None else None
        ceffort = clean_effort(reasoning_effort) if reasoning_effort is not None else None
        # Derive a provider from an explicit "provider/model" id when the
        # source did not provide one independently.
        if cprovider is None and "/" in cid:
            cprovider = clean_id(cid.split("/", 1)[0])
        cagent = None
        if agent is not None:
            cagent = clean_id(agent) or clean_name(agent)

        key = (cid, cprovider, evidence, source, cagent, ceffort)
        if key in self._model_keys:
            return False
        self._model_keys.add(key)
        self.models.append({
            "id": cid,
            "name": cname,
            "provider": cprovider,
            "reasoning_effort": ceffort,
            "evidence": evidence,
            "source": source,
            "agent": cagent,
            "callable": None,
        })
        return True


# ---------------------------------------------------------------------------
# Safe file reads
# ---------------------------------------------------------------------------


def read_bytes_limited(report: Report, path: str, limit: int, kind: str):
    """Read at most ``limit`` bytes from a regular, non-symlink file."""
    # Refuse the whole path (symlinked parents included) before any stat/open.
    if not guard_scan_path(report, path, kind):
        return None
    try:
        st = os.stat(path, follow_symlinks=False)
    except FileNotFoundError:
        report.note_scanned(kind, path, "missing")
        return None
    except OSError as exc:
        report.note_scanned(kind, path, "error")
        report.note_parse_error(path, kind, type(exc).__name__)
        return None

    if stat.S_ISLNK(st.st_mode):
        report.note_skip("symlinks", path, "final_path_is_symlink")
        report.note_scanned(kind, path, "skipped_symlink")
        return None
    if not stat.S_ISREG(st.st_mode):
        report.note_skip("non_regular", path, "not_a_regular_file")
        report.note_scanned(kind, path, "skipped_non_regular")
        return None
    if st.st_size > limit:
        report.note_skip("oversized", path, "size=%d limit=%d" % (st.st_size, limit))
        report.note_scanned(kind, path, "skipped_oversized")
        return None

    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
    try:
        fd = os.open(path, flags)
    except OSError as exc:
        report.note_parse_error(path, kind, type(exc).__name__)
        return None
    try:
        data = os.read(fd, limit + 1)
    finally:
        os.close(fd)
    if len(data) > limit:
        report.note_skip("oversized", path, "grew_past_limit")
        report.note_scanned(kind, path, "skipped_oversized")
        return None
    report.note_scanned(kind, path, "read")
    return data


def load_toml(report: Report, path: str, limit: int, kind: str):
    if tomllib is None:
        report.diagnostics["unsupported"].append(
            {"path": path, "reason": "tomllib_unavailable"}
        )
        return None
    data = read_bytes_limited(report, path, limit, kind)
    if data is None:
        return None
    try:
        return tomllib.loads(data.decode("utf-8", "replace"))
    except Exception as exc:  # tomllib.TOMLDecodeError and friends
        report.note_parse_error(path, kind, "toml:" + type(exc).__name__)
        return None


def load_json(report: Report, path: str, limit: int, kind: str):
    data = read_bytes_limited(report, path, limit, kind)
    if data is None:
        return None
    try:
        return json.loads(data.decode("utf-8", "replace"))
    except Exception as exc:
        report.note_parse_error(path, kind, "json:" + type(exc).__name__)
        return None


def parse_md_frontmatter(text: str) -> dict:
    """Extract only simple ``name``/``model`` scalars from YAML frontmatter."""
    fields = {}
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return fields
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return fields
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_\-]*)\s*:\s*(.*)$", line)
        if not m:
            continue
        key, value = m.group(1), m.group(2).strip()
        if key not in ("name", "model"):
            continue
        if not value or value[0] in "[{|>&*":
            continue  # lists, maps, block scalars, anchors: not a simple value
        value = value.strip().strip('"').strip("'")
        if value:
            fields[key] = value
    return fields


# ---------------------------------------------------------------------------
# Scanners
# ---------------------------------------------------------------------------


def detect_installed_clis(report: Report) -> None:
    """PATH detection only.  Never executes what it finds."""
    for name in KNOWN_CLIS:
        path = safe_which(name, report, is_forbidden)
        report.agents["installed"].append(
            {"name": name, "found": bool(path), "path": path}
        )


def scan_agent_dir(report: Report, directory: str, kind: str, scope: str) -> None:
    """Single-level scan of an agent-definition directory."""
    # Guard the directory (and every existing parent) before isdir/scandir, so
    # a symlinked ``.claude``/``agents``/root is never entered.
    if not guard_scan_path(report, directory, "agents"):
        return
    if not os.path.isdir(directory):
        report.note_scanned("agents", directory, "missing")
        return
    report.note_scanned("agents", directory, "exists")
    try:
        entries = sorted(os.scandir(directory), key=lambda e: e.name)
    except OSError as exc:
        report.note_parse_error(directory, "agents", type(exc).__name__)
        return
    for entry in entries:
        name = entry.name
        if name.startswith("."):
            continue
        path = entry.path
        try:
            if entry.is_symlink():
                report.note_skip("symlinks", path, "agent_entry_is_symlink")
                continue
            if not entry.is_file(follow_symlinks=False):
                continue  # nested dirs are out of scope: one level only
        except OSError:
            continue
        if kind == "codex":
            if not name.endswith(".toml"):
                continue
            data = load_toml(report, path, MAX_AGENT_FILE_BYTES, "agents")
            if not isinstance(data, dict):
                continue
            raw_name = data.get("name")
            raw_model = data.get("model")
            raw_provider = data.get("model_provider")
        else:  # claude / opencode markdown
            if not name.endswith(".md"):
                continue
            blob = read_bytes_limited(report, path, MAX_AGENT_FILE_BYTES, "agents")
            if blob is None:
                continue
            fields = parse_md_frontmatter(blob.decode("utf-8", "replace"))
            raw_name = fields.get("name")
            raw_model = fields.get("model")
            raw_provider = None

        # A missing/unsafe ``name`` falls back to the *filename stem* (the raw
        # name with its extension stripped), and even that is validated.  The
        # raw definition value and the extension-bearing filename are untrusted,
        # so neither is echoed in diagnostics nor used as the model's agent.
        ext = ".toml" if kind == "codex" else ".md"
        stem = name[: -len(ext)] if name.endswith(ext) else name
        agent_name = clean_id(raw_name) or clean_name(raw_name)
        if not agent_name:
            agent_name = clean_name(stem) or clean_id(stem)
            if not agent_name:
                report.warn(
                    "agent definition without a safe name in the %s scope" % scope
                )
        model_id = clean_id(raw_model)
        record = {
            "name": agent_name,
            "model": model_id,
            "provider": kind,
            "source": "%s_agents" % kind,
            "scope": scope,
            "evidence": "defined",
            "path": path,
        }
        report.agents["defined"].append(record)
        if isinstance(raw_model, str) and raw_model.strip():
            # Route through add_model even when validation fails, so rejected
            # (e.g. secret-looking) values are counted consistently.
            report.add_model(
                mid=raw_model,
                provider=raw_provider if isinstance(raw_provider, str) else None,
                evidence=EVIDENCE_CONFIGURED,
                source="%s_agent_definition" % kind,
                agent=agent_name,
            )


def extract_codex_config(report: Report, path: str) -> None:
    data = load_toml(report, path, MAX_CONFIG_FILE_BYTES, "codex_config")
    if not isinstance(data, dict):
        return
    top_model = data.get("model")
    if isinstance(top_model, str):
        report.add_model(
            mid=top_model,
            provider=data.get("model_provider"),
            evidence=EVIDENCE_CONFIGURED,
            source="codex_config",
            reasoning_effort=data.get("model_reasoning_effort"),
        )
    profiles = data.get("profiles")
    if isinstance(profiles, dict):
        for profile_name, profile in profiles.items():
            if not isinstance(profile, dict):
                continue
            model = profile.get("model")
            if isinstance(model, str):
                report.add_model(
                    mid=model,
                    provider=profile.get("model_provider"),
                    evidence=EVIDENCE_CONFIGURED,
                    source="codex_config_profile",
                    agent="profile:" + str(profile_name),
                    reasoning_effort=profile.get("model_reasoning_effort"),
                )


def extract_claude_settings(report: Report, path: str) -> None:
    # Only the top-level ``model`` key is read. ``env``/``hooks`` never are.
    data = load_json(report, path, MAX_CONFIG_FILE_BYTES, "claude_settings")
    if not isinstance(data, dict):
        return
    model = data.get("model")
    if isinstance(model, str):
        report.add_model(
            mid=model,
            evidence=EVIDENCE_CONFIGURED,
            source="claude_settings",
        )


def extract_opencode_config(report: Report, path: str) -> None:
    data = load_json(report, path, MAX_CONFIG_FILE_BYTES, "opencode_config")
    if not isinstance(data, dict):
        return
    for key, source in (("model", "opencode_config"), ("small_model", "opencode_config_small")):
        model = data.get(key)
        if isinstance(model, str):
            report.add_model(mid=model, evidence=EVIDENCE_CONFIGURED, source=source)


def extract_models_cache(report: Report, path: str) -> None:
    data = load_json(report, path, MAX_CACHE_FILE_BYTES, "codex_models_cache")
    if not isinstance(data, dict):
        return
    models = data.get("models")
    if not isinstance(models, list):
        return
    for item in models:
        if not isinstance(item, dict):
            continue
        report.add_model(
            mid=item.get("slug"),
            name=item.get("display_name"),
            evidence=EVIDENCE_CATALOG,
            source="codex_models_cache",
        )


def run_dim_cli(report: Report) -> None:
    """Run the single verified local command: ``dim model list --json``."""
    cli = report.diagnostics["cli"]
    binary = safe_which("dim", report, is_forbidden)
    cli["binary"] = binary
    if not binary:
        cli["reason"] = "dim_not_on_path"
        return
    cmd = [binary, "model", "list", "--json"]
    cli["command"] = "dim model list --json"
    try:
        proc = subprocess.run(
            cmd,
            shell=False,
            capture_output=True,
            timeout=CLI_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        cli["ran"] = True
        cli["reason"] = "timeout"
        report.warn("dim model list --json timed out after %ds" % CLI_TIMEOUT_SECONDS)
        return
    except OSError as exc:
        cli["ran"] = True
        cli["reason"] = "exec_error:" + type(exc).__name__
        return

    cli["ran"] = True
    cli["exit_status"] = proc.returncode
    # stderr is deliberately discarded; only exit status is reported.
    stdout = proc.stdout or b""
    if proc.returncode != 0 or not stdout:
        cli["json_supported"] = False
        cli["reason"] = "nonzero_exit" if proc.returncode != 0 else "empty_stdout"
        return
    try:
        parsed = json.loads(stdout.decode("utf-8", "replace"))
    except Exception:
        cli["json_supported"] = False
        cli["reason"] = "stdout_not_json"
        return
    if not isinstance(parsed, list):
        cli["json_supported"] = False
        cli["reason"] = "json_not_a_list"
        return
    cli["json_supported"] = True
    cli["reason"] = "ok"
    count = 0
    for item in parsed:
        if not isinstance(item, dict):
            continue
        if report.add_model(
            mid=item.get("id"),
            name=item.get("name"),
            provider=item.get("providerId"),
            evidence=EVIDENCE_CATALOG,
            source="dim_cli",
        ):
            count += 1
    cli["model_count"] = count


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def build_report(home: str, project: str, no_cli: bool, home_is_real: bool) -> Report:
    report = Report()
    report.scan_roots = [home, project]
    report.diagnostics["home"] = home
    report.diagnostics["project"] = project

    detect_installed_clis(report)

    # Agent definitions (home scope).
    scan_agent_dir(report, os.path.join(home, ".codex", "agents"), "codex", "home")
    scan_agent_dir(report, os.path.join(home, ".claude", "agents"), "claude", "home")
    scan_agent_dir(
        report, os.path.join(home, ".config", "opencode", "agents"), "opencode", "home"
    )
    # Agent definitions (project scope).
    scan_agent_dir(report, os.path.join(project, ".codex", "agents"), "codex", "project")
    scan_agent_dir(report, os.path.join(project, ".claude", "agents"), "claude", "project")
    scan_agent_dir(report, os.path.join(project, ".opencode", "agents"), "opencode", "project")

    # Config files (exact paths only).
    extract_codex_config(report, os.path.join(home, ".codex", "config.toml"))
    extract_models_cache(report, os.path.join(home, ".codex", "models_cache.json"))
    extract_claude_settings(report, os.path.join(home, ".claude", "settings.json"))
    extract_claude_settings(report, os.path.join(project, ".claude", "settings.json"))

    opencode_json = os.path.join(home, ".config", "opencode", "opencode.json")
    opencode_jsonc = os.path.join(home, ".config", "opencode", "opencode.jsonc")
    # Guard before isfile: isfile would follow a symlinked final component.
    if guard_scan_path(report, opencode_json, "opencode_config") and os.path.isfile(
        opencode_json
    ):
        extract_opencode_config(report, opencode_json)
    elif guard_scan_path(
        report, opencode_jsonc, "opencode_config"
    ) and os.path.isfile(opencode_jsonc):
        report.diagnostics["unsupported"].append(
            {"path": opencode_jsonc, "reason": "jsonc_not_supported"}
        )

    # CLI execution policy.
    cli = report.diagnostics["cli"]
    if no_cli:
        cli["enabled"] = False
        cli["reason"] = "disabled_by_flag"
    elif not home_is_real:
        cli["enabled"] = False
        cli["reason"] = "home_override_is_not_real_home"
    else:
        cli["enabled"] = True
        run_dim_cli(report)

    report.diagnostics["secret_rejections"] = report.secret_rejections
    report.diagnostics["counts"] = {
        "agents_installed": sum(1 for a in report.agents["installed"] if a["found"]),
        "agents_defined": len(report.agents["defined"]),
        "models": len(report.models),
        "models_configured": sum(1 for m in report.models if m["evidence"] == EVIDENCE_CONFIGURED),
        "models_catalog": sum(1 for m in report.models if m["evidence"] == EVIDENCE_CATALOG),
        "models_local_installed": sum(
            1 for m in report.models if m["evidence"] == EVIDENCE_LOCAL_INSTALLED
        ),
    }
    if not any(m["evidence"] == EVIDENCE_LOCAL_INSTALLED for m in report.models):
        report.diagnostics.setdefault("notes", []).append(
            "local-installed models are not enumerated: listing them would require "
            "running a local runtime (ollama/lms), which this script never does."
        )
    report.agents = redact_payload(report.agents, looks_like_secret)
    report.diagnostics = redact_payload(report.diagnostics, looks_like_secret)
    return report


class SafeArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        # argparse may echo arbitrary argv, including sensitive path names.
        self.print_usage(sys.stderr)
        self.exit(2, "discover_local.py: error: invalid arguments\n")


def parse_args(argv):
    parser = SafeArgumentParser(
        prog="discover_local.py",
        description="Read-only discovery of local agents and models.",
    )
    parser.add_argument("--project", default=os.getcwd(),
                        help="Project root to scan for project-scoped agents (default: cwd).")
    parser.add_argument("--home", default=None,
                        help="Home directory to scan (default: real home). A non-real "
                             "home suppresses all CLI execution for hermetic testing.")
    parser.add_argument("--no-cli", action="store_true",
                        help="Never execute any CLI (including dim).")
    parser.add_argument("--output", default=None,
                        help="Write JSON here instead of stdout.")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    real_home = os.path.realpath(os.path.expanduser("~"))
    # Keep the caller's paths lexical (never realpath'd): resolving symlinks
    # here would silently defeat the scan guard's component checks.
    if args.home:
        home = os.path.abspath(os.path.expanduser(args.home))
    else:
        home = real_home
    home_is_real = home == real_home
    project = os.path.abspath(args.project)

    report = build_report(home, project, args.no_cli, home_is_real)
    payload = {
        "schema_version": SCHEMA_VERSION,
        "agents": report.agents,
        "models": report.models,
        "diagnostics": report.diagnostics,
    }
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"

    if args.output:
        out_path = os.path.abspath(args.output)
        parent = os.path.dirname(out_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(text)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as exc:
        # Exception text/tracebacks may contain paths or raw argv.
        sys.stderr.write("discover_local.py: error: %s\n" % type(exc).__name__)
        raise SystemExit(1)
