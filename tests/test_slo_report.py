from pathlib import Path

from bench.runner import run_bench
from orchestrator import slo_report


def test_slo_report_contains_bot_row():
    run_bench("Treasury-BOT", iterations=3, warmup=1)
    slo_report.build_report()
    md = Path("artifacts/bench/_index.md").read_text()
    assert "Treasury-BOT" in md
