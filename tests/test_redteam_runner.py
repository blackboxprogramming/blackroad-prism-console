from pathlib import Path

from metrics import COUNTERS
from redteam import runner


def test_redteam_run_creates_artifacts():
    before = COUNTERS.get("redteam_runs", 0)
    report = runner.run_scenario("pricing_leak_guard")
    after = COUNTERS.get("redteam_runs", 0)
    assert report.passed
    assert after == before + 1
    out_dir = Path("artifacts/redteam/pricing_leak_guard")
    assert (out_dir / "report.md").exists()
    assert (out_dir / "log.jsonl").exists()
