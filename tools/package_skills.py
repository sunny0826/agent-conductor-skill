"""Package skills with the transitive closure of local Markdown links."""
from pathlib import Path
import argparse
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "skills"
DIST = ROOT / "dist"
LINK = re.compile(r"\]\(([^)]+)\)")


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


def skill_list(names):
    return "".join(f"- [{name}](../../{name}/SKILL.md)：{description(name)}\n" for name in names)


def indexes(names):
    principles = [name for name in names if name.startswith("principle-")]
    tasks = [name for name in names if name not in principles]
    catalog = BASE / "skill-help/references/catalog.md"
    principle_index = BASE / "rigor/references/principles.md"
    return {
        catalog: replace_block(catalog.read_text(), "skills", skill_list(tasks)),
        principle_index: replace_block(principle_index.read_text(), "principles", skill_list(principles)),
    }


def readme(results):
    path = ROOT / "README.md"
    by_name = {item["archive"].removesuffix(".zip"): item for item in results}
    principles = [name for name in by_name if name.startswith("principle-")]
    tasks = [name for name in by_name if name not in principles]
    text = re.sub(
        r"本仓库提供 \d+ 个任务技能和 \d+ 个原则技能",
        f"本仓库提供 {len(tasks)} 个任务技能和 {len(principles)} 个原则技能",
        path.read_text(),
    )
    text = re.sub(r"(?m)^\d+ 个原则技能按需读取", f"{len(principles)} 个原则技能按需读取", text)
    text = re.sub(
        r"\[下载\]\(dist/([\w-]+)\.zip\)（\d+ 个技能，\d+ 个文件）",
        lambda match: (
            f"[下载](dist/{match.group(1)}.zip)"
            f"（{len(by_name[match.group(1)]['skills'])} 个技能，{by_name[match.group(1)]['files']} 个文件）"
        ),
        text,
    )
    rows = "".join(
        f"| [{name}](skills/{name}/SKILL.md) | {description(name)} | "
        f"[{by_name[name]['files']} 个文件](dist/{name}.zip) |\n"
        for name in tasks
    )
    return {path: replace_block(text, "readme", "| 技能 | 用途 | ZIP |\n|---|---|---|\n" + rows)}


def sync(generated, check):
    for path, text in generated.items():
        if path.read_text() == text:
            continue
        if check:
            raise ValueError(f"{path.relative_to(ROOT)} is stale; run tools/package_skills.py")
        path.write_text(text)


def dependencies(directory):
    found = set()
    for doc in directory.rglob("*.md"):
        for raw in LINK.findall(doc.read_text()):
            target = raw.strip("<>").split("#", 1)[0]
            if not target or re.match(r"[a-zA-Z][\w+.-]*:", target):
                continue
            path = (doc.parent / target).resolve()
            if not path.exists():
                raise ValueError(f"Broken reference: {doc.relative_to(ROOT)} -> {target}")
            try:
                owner = path.relative_to(BASE).parts[0]
            except ValueError as error:
                raise ValueError(f"Reference outside skills: {doc} -> {target}") from error
            if not (BASE / owner / "SKILL.md").is_file():
                raise ValueError(f"Reference is not owned by a skill: {path}")
            found.add(owner)
    return found


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


def files(names):
    return sorted(p for name in names for p in (BASE / name).rglob("*") if p.is_file())


def package(name, names, check):
    members = {str(p.relative_to(BASE)): p for p in files(names)}
    archive = DIST / f"{name}.zip"
    if not check:
        DIST.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as output:
            for member, path in members.items():
                output.write(path, member)
    with zipfile.ZipFile(archive) as output:
        assert output.testzip() is None, archive
        assert len(output.namelist()) == len(set(output.namelist())), archive
        assert set(output.namelist()) == set(members), archive
        for member, path in members.items():
            assert output.read(member) == path.read_bytes(), member
    return {"archive": archive.name, "skills": names, "files": len(members)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    names = skill_names()
    for name in names:
        validate(name)
    sync(indexes(names), args.check)
    for name in names:
        dependencies(BASE / name)
    results = [package(name, closure([name]), args.check) for name in names]
    sync(readme(results), args.check)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    for item in results:
        print(f"{item['archive']}: {len(item['skills'])} skills, {item['files']} files")


if __name__ == "__main__":
    main()
