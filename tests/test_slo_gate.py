from bench import runner
from orchestrator import orchestrator, slo_report
from tests.test_bench_runner import make_timer


def test_slo_gate_regression(tmp_path, monkeypatch):
    monkeypatch.setattr(runner, "ARTIFACTS", tmp_path)
    monkeypatch.setattr(runner, "METRICS_PATH", tmp_path / "metrics.jsonl")
    monkeypatch.setattr(orchestrator, "_memory_path", tmp_path / "mem.jsonl")
    monkeypatch.setattr(slo_report, "ARTIFACTS", tmp_path)
    # baseline
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 20, 30, 40]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1)
    # regression run
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 100, 100, 100]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1)
    assert not slo_report.gate("regressions")
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
