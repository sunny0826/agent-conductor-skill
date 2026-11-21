"""Package skills with the transitive closure of local Markdown links."""
from pathlib import Path
import argparse
import io
import json
import os
import re
import stat
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "skills"
DIST = ROOT / "dist"
LINK = re.compile(r"\]\(([^)]+)\)")
IGNORED_NAMES = {"__pycache__", ".DS_Store"}


def skill_names():
    return sorted(
        p.name for p in BASE.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()
    )


def validate(name):
    raw = (BASE / name / "SKILL.md").read_text()
    if not raw.startswith("---\n") or len(raw.split("---", 2)) != 3:
        raise ValueError(f"Invalid frontmatter: {name}")
    frontmatter = raw.split("---", 2)[1]
    if not re.search(r"^name: " + re.escape(name) + r"\s*$", frontmatter, re.M):
        raise ValueError(f"Name mismatch: {name}")
    if not re.search(r"^description: \S", frontmatter, re.M):
        raise ValueError(f"Missing description: {name}")
    if not (BASE / name / "LICENSE").is_file():
        raise ValueError(f"Missing license: {name}")


def description(name):
    raw = (BASE / name / "SKILL.md").read_text()
    return re.search(r'^description: "?(.*?)"?$', raw, re.M).group(1)


def replace_block(text, tag, body):
    pattern = re.compile(rf"(<!-- generated:{tag} -->\n).*?(<!-- /generated -->)", re.S)
    if not pattern.search(text):
        raise ValueError(f"Missing generated block: {tag}")
    return pattern.sub(lambda match: match.group(1) + body + match.group(2), text)


def readme(results):
    path = ROOT / "README.md"
    by_name = {item["archive"].removesuffix(".zip"): item for item in results}
    tasks = sorted(by_name)
    text = re.sub(
        r"本仓库提供 \d+ 个技能",
        f"本仓库提供 {len(tasks)} 个技能",
        path.read_text(),
    )
    for featured in ("rigor", "agent-conductor"):
        item = by_name[featured]
        text = re.sub(
            rf"(\[{re.escape(featured)}\]\(skills/{re.escape(featured)}/SKILL\.md\)[^\n]*?（闭包：)\d+ 个技能，\d+ 个文件",
            rf"\g<1>{len(item['skills'])} 个技能，{item['files']} 个文件",
            text,
        )
    rows = "".join(
        f"| [{name}](skills/{name}/SKILL.md) | {description(name)} | "
        f"{len(by_name[name]['skills'])} 个技能 / {by_name[name]['files']} 个文件 |\n"
        for name in tasks
    )
    return {path: replace_block(text, "readme", "| 技能 | 用途 | 闭包规模 |\n|---|---|---|\n" + rows)}


def sync(generated, check):
    for path, text in generated.items():
        if path.read_text() == text:
            continue
        if check:
            raise ValueError(f"{path.relative_to(ROOT)} is stale; run tools/package_skills.py")
        path.write_text(text)


def dependencies(directory):
    found = set()
    base_resolved = BASE.resolve()
    for doc in directory.rglob("*.md"):
        for raw in LINK.findall(doc.read_text()):
            target = raw.strip("<>").split("#", 1)[0]
            if not target or re.match(r"[a-zA-Z][\w+.-]*:", target):
                continue
            path = (doc.parent / target).resolve()
            if not path.exists():
                raise ValueError(f"Broken reference: {doc.relative_to(ROOT)} -> {target}")
            try:
                owner = path.relative_to(base_resolved).parts[0]
            except ValueError as error:
                raise ValueError(f"Reference outside skills: {doc} -> {target}") from error
            if not (base_resolved / owner / "SKILL.md").is_file():
                raise ValueError(f"Reference is not owned by a skill: {path}")
            found.add(owner)
    return found


def check_cycles(names):
    graph = {name: sorted(dependencies(BASE / name) - {name}) for name in names}
    state = {}
    stack = []

    def visit(node):
        state[node] = 1
        stack.append(node)
        for nxt in graph.get(node, ()):
            if state.get(nxt) == 1:
                idx = stack.index(nxt)
                cycle = " -> ".join(stack[idx:] + [nxt])
                raise ValueError(f"Dependency cycle: {cycle}")
            if state.get(nxt) is None:
                visit(nxt)
        stack.pop()
        state[node] = 2

    for name in sorted(names):
        if state.get(name) is None:
            visit(name)


def closure(names):
    pending = set(names)
    complete = set()
    while pending:
        name = pending.pop()
        if name in complete:
            continue
        complete.add(name)
        pending.update(dependencies(BASE / name) - complete)
    return sorted(complete)


def is_ignored_file(path):
    if any(part in IGNORED_NAMES for part in path.parts):
        return True
    if path.suffix == ".pyc":
        return True
    if path.name.startswith("test_") or ".test." in path.name:
        return True
    return False


def files(names):
    return sorted(
        p for name in names for p in (BASE / name).rglob("*")
        if p.is_file() and not is_ignored_file(p.relative_to(BASE))
    )


def build_zip_bytes(members):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as output:
        for member, path in members.items():
            info = zipfile.ZipInfo(member, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            mode = 0o755 if os.access(path, os.X_OK) else 0o644
            info.external_attr = (stat.S_IFREG | mode) << 16
            output.writestr(info, path.read_bytes())
    data = buf.getvalue()
    with zipfile.ZipFile(io.BytesIO(data)) as output:
        assert output.testzip() is None, members
        assert len(output.namelist()) == len(set(output.namelist()))
        assert set(output.namelist()) == set(members)
        for member, path in members.items():
            assert output.read(member) == path.read_bytes(), member
    return data


def package(name, names, check, verify_dist=False):
    members = {str(p.relative_to(BASE)): p for p in files(names)}
    archive = DIST / f"{name}.zip"
    data = build_zip_bytes(members)
    if not check:
        DIST.mkdir(parents=True, exist_ok=True)
        if not archive.is_file() or archive.read_bytes() != data:
            archive.write_bytes(data)
    elif verify_dist:
        if not archive.is_file() or archive.read_bytes() != data:
            raise ValueError(f"{archive.relative_to(ROOT)} is missing or stale; run tools/package_skills.py")
    return {"archive": archive.name, "skills": names, "files": len(members)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--verify-dist", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    if args.verify_dist:
        args.check = True
    names = skill_names()
    for name in names:
        validate(name)
    check_cycles(names)
    results = [package(name, closure([name]), args.check, args.verify_dist) for name in names]
    expected = {f"{name}.zip" for name in names}
    if not args.check and DIST.is_dir():
        for stale in DIST.glob("*.zip"):
            if stale.name not in expected:
                stale.unlink()
    elif args.verify_dist and DIST.is_dir():
        stale = sorted(p.name for p in DIST.glob("*.zip") if p.name not in expected)
        if stale:
            raise ValueError(f"Stale archives in {DIST.relative_to(ROOT)}: {', '.join(stale)}")
    sync(readme(results), args.check)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    for item in results:
        print(f"{item['archive']}: {len(item['skills'])} skills, {item['files']} files")


if __name__ == "__main__":
    main()
