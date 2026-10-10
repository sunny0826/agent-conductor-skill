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
    if name == "rigor":
        playbooks = {p.name for p in (BASE / "rigor/playbooks").glob("*.md")}
        if len(playbooks) != 23:
            raise ValueError("rigor does not contain 23 playbooks")


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
        dependencies(BASE / name)
    results = [package(name, closure([name]), args.check) for name in names]
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    for item in results:
        print(f"{item['archive']}: {len(item['skills'])} skills, {item['files']} files")


if __name__ == "__main__":
    main()
