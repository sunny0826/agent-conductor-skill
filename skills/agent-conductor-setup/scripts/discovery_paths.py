"""Output path redaction and conservative PATH lookup (no CLI execution)."""

import os
import re
import stat


def redact_path(path, looks_like_secret):
    return re.sub(r"[^/\\]+", lambda m: "<redacted>" if
                  looks_like_secret(m[0]) else m[0], path)


def redact_payload(value, looks_like_secret):
    """Only path-bearing fields; metadata validators remain unchanged."""
    if isinstance(value, dict):
        return {key: redact_path(item, looks_like_secret)
                if key in {"path", "home", "project", "binary"} and isinstance(item, str)
                else redact_payload(item, looks_like_secret)
                for key, item in value.items()}
    if isinstance(value, list):
        return [redact_payload(item, looks_like_secret) for item in value]
    return value


def checked_target(path, forbidden):
    """Inspect links one component at a time, before touching their targets.

    Do not realpath first: it could traverse a forbidden target. Check raw
    link text before normalizing (including paths containing '..'). Static
    checks do not eliminate concurrent filesystem replacement races.
    """
    if forbidden(path):
        return None, "forbidden_path"
    absolute = path if os.path.isabs(path) else os.path.join(os.getcwd(), path)
    pending = absolute.split(os.sep)[1:]
    current = os.sep
    links = 0
    while pending:
        part = pending.pop(0)
        if part in ("", "."):
            continue
        if part == "..":
            current = os.path.dirname(current)
            continue
        candidate = os.path.join(current, part)
        if forbidden(candidate):
            return None, "forbidden_path"
        try:
            info = os.lstat(candidate)
            if stat.S_ISLNK(info.st_mode):
                target = os.readlink(candidate)
                if forbidden(target):
                    return None, "forbidden_symlink_target"
                links += 1
                if links > 40:
                    return None, "symlink_limit"
                if os.path.isabs(target):
                    current = os.sep
                pending = target.split(os.sep) + pending
                continue
        except OSError:
            return None, "unavailable"
        # Even empty or dot components require directory traversal (ENOTDIR).
        if pending and not stat.S_ISDIR(info.st_mode):
            return None, "unavailable"
        current = candidate
    return current, None


def safe_which(name, report, forbidden):
    """Common lookup for detection and dim; no rejected path text is logged."""
    rejected = report.diagnostics.setdefault("path_lookup_rejections", {})
    for directory in os.environ.get("PATH", os.defpath).split(os.pathsep):
        candidate = os.path.join(directory or os.curdir, name)
        target, reason = checked_target(candidate, forbidden)
        if reason:
            if reason != "unavailable":
                rejected[reason] = rejected.get(reason, 0) + 1
            continue
        # All target components have been checked, including executable links.
        if os.path.isfile(target) and os.access(target, os.X_OK):
            return candidate if os.path.isabs(candidate) else os.path.join(os.getcwd(), candidate)
    return None
