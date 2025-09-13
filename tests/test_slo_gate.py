import json
from pathlib import Path

from bench.runner import run_bench
from orchestrator import slo_report


def test_slo_gate_detects_regression():
    run_bench("Treasury-BOT", iterations=3, warmup=1)
    path = Path("artifacts/bench/Treasury-BOT/summary.json")
    current = json.loads(path.read_text())
    prev = current.copy()
    prev["p95"] = max(0, current["p95"])
    current["p95"] = current["p95"] + 10
    path.write_text(json.dumps(current))
    (path.parent / "previous_summary.json").write_text(json.dumps(prev))
    rc = slo_report.gate(fail_on="regressions")
    assert rc == 1
