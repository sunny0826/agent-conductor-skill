"""Tests for tools/package_skills.py."""
import hashlib
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import zipfile

TOOLS_DIR = Path(__file__).resolve().parent
ROOT = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))
try:
    import package_skills
finally:
    if str(TOOLS_DIR) in sys.path:
        sys.path.remove(str(TOOLS_DIR))


def write_skill(base: Path, name: str, body: str = "Body.", extra: dict[str, str] | None = None):
    skill_dir = base / name
    (skill_dir / "agents").mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(
        f'---\nname: {name}\ndescription: "用于测试 {name} 时。"\n---\n\n# {name}\n\n{body}\n',
        encoding="utf-8",
    )
    (skill_dir / "LICENSE").write_text("MIT\n", encoding="utf-8")
    (skill_dir / "agents" / "openai.yaml").write_text("interface: {}\n", encoding="utf-8")
    for rel, content in (extra or {}).items():
        target = skill_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")


class PackageSkillsTests(unittest.TestCase):
    def test_deterministic_zip_ignores_mtime_and_filters_junk(self):
        with tempfile.TemporaryDirectory(prefix="pkg-test-") as tmp:
            tmp_root = Path(tmp)
            base = tmp_root / "skills"
            dist = tmp_root / "dist"
            write_skill(
                base,
                "alpha",
                extra={
                    "scripts/run.sh": "#!/bin/sh\necho ok\n",
                    "scripts/test_run.py": "assert True\n",
                    "scripts/helper.test.mjs": "export {};\n",
                    "scripts/__pycache__/run.cpython-314.pyc": "junk",
                    ".DS_Store": "junk",
                },
            )
            os.chmod(base / "alpha/scripts/run.sh", 0o755)
            with patch.object(package_skills, "ROOT", tmp_root), \
                 patch.object(package_skills, "BASE", base), \
                 patch.object(package_skills, "DIST", dist):
                package_skills.package("alpha", ["alpha"], check=False)
                first_bytes = (dist / "alpha.zip").read_bytes()
                first_hash = hashlib.sha256(first_bytes).hexdigest()

                os.utime(base / "alpha/SKILL.md", (1700000000, 1700000000))
                os.utime(base / "alpha/scripts/run.sh", (1700000123, 1700000123))
                (dist / "alpha.zip").unlink()

                package_skills.package("alpha", ["alpha"], check=False)
                second_bytes = (dist / "alpha.zip").read_bytes()
                self.assertEqual(first_hash, hashlib.sha256(second_bytes).hexdigest())

                with zipfile.ZipFile(dist / "alpha.zip") as zf:
                    names = sorted(zf.namelist())
                    self.assertEqual(
                        names,
                        [
                            "alpha/LICENSE",
                            "alpha/SKILL.md",
                            "alpha/agents/openai.yaml",
                            "alpha/scripts/run.sh",
                        ],
                    )
                    self.assertTrue(all(info.date_time == (1980, 1, 1, 0, 0, 0) for info in zf.infolist()))

    def test_cycle_detection_rejects_mutual_skill_links(self):
        with tempfile.TemporaryDirectory(prefix="pkg-cycle-") as tmp:
            tmp_root = Path(tmp)
            base = tmp_root / "skills"
            write_skill(base, "alpha", body="See [beta](../beta/SKILL.md).")
            write_skill(base, "beta", body="See [alpha](../alpha/SKILL.md).")
            with patch.object(package_skills, "ROOT", tmp_root), \
                 patch.object(package_skills, "BASE", base):
                with self.assertRaisesRegex(ValueError, "Dependency cycle: alpha -> beta -> alpha"):
                    package_skills.check_cycles(["alpha", "beta"])

    def test_repo_check_passes(self):
        proc = subprocess.run(
            [sys.executable, "-B", str(TOOLS_DIR / "package_skills.py"), "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)


if __name__ == "__main__":
    unittest.main()
