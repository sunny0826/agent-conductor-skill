"""Tests for tools/render_skill_audit.py."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
SCRIPT = TOOLS_DIR / "render_skill_audit.py"


class RenderSkillAuditTests(unittest.TestCase):
    def _fixture(self, root: Path) -> Path:
        source = root / "audit-2030-01-01"
        source.mkdir()
        (source / "metadata.json").write_text(
            json.dumps(
                {
                    "date": "2030-01-01",
                    "counts": {"明确证据": 1, "未见明确证据": 1},
                    "removed_after_audit": ["legacy-skill"],
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        (source / "task-skills.json").write_text(
            json.dumps(
                [
                    {
                        "name": "how",
                        "kind": "任务",
                        "status": "明确证据",
                        "priority": "保留",
                        "reason": "Direct trace found",
                        "action": "Keep",
                        "source": "skills/how/SKILL.md",
                        "added": "2030-01-01",
                        "sha256": "abc123",
                        "evidence": [
                            {
                                "session_id": "00000001-0000-4000-8000-000000000001",
                                "url": "https://example.invalid/session/1",
                                "index": 2,
                                "note": "Called how",
                            }
                        ],
                    }
                ],
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        (source / "principle-skills.json").write_text(
            json.dumps(
                [
                    {
                        "name": "legacy-skill",
                        "kind": "原则",
                        "status": "未见明确证据",
                        "priority": "观察",
                        "reason": "No direct call",
                        "action": "Review",
                        "source": "skills/legacy-skill/SKILL.md",
                        "added": "2030-01-01",
                        "sha256": "def456",
                        "evidence": [],
                    }
                ],
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        (source / "report.template.html").write_text(
            "<html><style>__STYLE__</style><table>__ROWS__</table><script>__SCRIPT__</script></html>\n",
            encoding="utf-8",
        )
        (source / "report.css").write_text("body { color: #111; }\n", encoding="utf-8")
        (source / "report.js").write_text("console.log('ok');\n", encoding="utf-8")
        return source

    def test_render_and_check_exports(self):
        with tempfile.TemporaryDirectory(prefix="audit-render-") as tmp:
            root = Path(tmp)
            source = self._fixture(root)

            render_proc = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(source)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(render_proc.returncode, 0, render_proc.stdout + render_proc.stderr)
            self.assertIn("Rendered 3 audit exports", render_proc.stdout)

            html_text = (root / "audit-2030-01-01.html").read_text(encoding="utf-8")
            self.assertIn("legacy-skill（已移除）", html_text)
            self.assertIn('<a class="skill" href="skills/how/SKILL.md">how</a>', html_text)

            csv_text = (root / "audit-2030-01-01.csv").read_text(encoding="utf-8-sig")
            self.assertIn("how,任务,明确证据", csv_text)

            json_data = json.loads((root / "audit-2030-01-01.json").read_text(encoding="utf-8"))
            self.assertEqual([row["name"] for row in json_data["skills"]], ["how", "legacy-skill"])

            check_proc = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(source), "--check"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(check_proc.returncode, 0, check_proc.stdout + check_proc.stderr)

            (root / "audit-2030-01-01.csv").write_text("stale\n", encoding="utf-8")
            stale_proc = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(source), "--check"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(stale_proc.returncode, 0)
            self.assertIn("Stale audit export", stale_proc.stderr)


if __name__ == "__main__":
    unittest.main()
