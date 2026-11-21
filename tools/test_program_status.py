"""Tests for skills/rigor/scripts/program-status.py."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills/rigor/scripts/program-status.py"


def write_store(store: Path, *, units: str, ledger: str, gates: str):
    (store / "units.tsv").write_text(units, encoding="utf-8")
    (store / "ledger.tsv").write_text(ledger, encoding="utf-8")
    (store / "gates.md").write_text(gates, encoding="utf-8")


class ProgramStatusTests(unittest.TestCase):
    def test_renders_derived_status_and_prefers_verifier_over_self(self):
        with tempfile.TemporaryDirectory(prefix="program-status-") as tmp:
            store = Path(tmp)
            write_store(
                store,
                units=(
                    "id\ttrack\tstate\tbranch\tpr\thead\tbrief\n"
                    "U1\tcore\tdone\tfeat-1\t#1\tabc123\tFirst unit\n"
                    "U2\tcore\tdone\tfeat-2\t#2\tdef456\tSecond unit\n"
                    "U3\tui\tactive\tfeat-3\t\t\tPending unit\n"
                ),
                ledger=(
                    "pr\thead\tverdict\torigin\tevidence\n"
                    "#1\tabc123\tunit-test-verified\tself\tlogs/u1-self.txt\n"
                    "#1\tabc123\tlive-ui-verified\tverifier\tlogs/u1-verifier.png\n"
                    "#2\tdef456\ttype-check-only\tself\tlogs/u2-tsc.txt\n"
                ),
                gates="- [ ] Confirm rollout window\n- [x] Pick branch base\n",
            )
            proc = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(store)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
            self.assertIn("Current passing receipts: 1/3", proc.stdout)
            self.assertIn("Open gates: 1", proc.stdout)

            status = (store / "status.md").read_text(encoding="utf-8")
            self.assertIn("| U1 | core | done | #1 | abc123 | live-ui-verified | logs/u1-verifier.png |", status)
            self.assertIn("| U2 | core | done | #2 | def456 | type-check-only | logs/u2-tsc.txt |", status)
            self.assertIn("| U3 | ui | active |  |  | unverified |  |", status)
            self.assertIn("Done with a current passing ledger receipt: 1/3.", status)
            self.assertIn("Open gates: 1.", status)

    def test_invalid_inputs_preserve_previous_status(self):
        with tempfile.TemporaryDirectory(prefix="program-status-err-") as tmp:
            store = Path(tmp)
            prior = "# Previous status\n"
            (store / "status.md").write_text(prior, encoding="utf-8")
            write_store(
                store,
                units="id\ttrack\tstate\tbranch\tpr\thead\tbrief\nU1\tcore\tinvalid-state\tb\t#1\th\tx\n",
                ledger="pr\thead\tverdict\torigin\tevidence\n",
                gates="",
            )
            bad_state = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(store)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(bad_state.returncode, 0)
            self.assertIn("unknown state", bad_state.stderr)
            self.assertEqual((store / "status.md").read_text(encoding="utf-8"), prior)

            write_store(
                store,
                units="id\ttrack\tstate\tbranch\tpr\thead\tbrief\nU1\tcore\tdone\tb\t#1\th\tx\n",
                ledger="pr\thead\tverdict\torigin\tevidence\n#1\th\tunit-test-verified\tself\t\n",
                gates="",
            )
            missing_evidence = subprocess.run(
                [sys.executable, "-B", str(SCRIPT), str(store)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(missing_evidence.returncode, 0)
            self.assertIn("missing PR, head or evidence", missing_evidence.stderr)
            self.assertEqual((store / "status.md").read_text(encoding="utf-8"), prior)


if __name__ == "__main__":
    unittest.main()
