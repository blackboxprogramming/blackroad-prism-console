import json

from bench import runner
from orchestrator import orchestrator, slo_report
from tests.test_bench_runner import make_timer


def test_slo_report_table(tmp_path, monkeypatch):
    monkeypatch.setattr(runner, "ARTIFACTS", tmp_path)
    monkeypatch.setattr(runner, "METRICS_PATH", tmp_path / "metrics.jsonl")
    monkeypatch.setattr(orchestrator, "_memory_path", tmp_path / "mem.jsonl")
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 20, 30, 40]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1)
    monkeypatch.setattr(slo_report, "ARTIFACTS", tmp_path)
    slo_report.build_report()
    md = (tmp_path / "_index.md").read_text()
    assert "Treasury-BOT" in md
    assert "True" in md
    # flip to failing
    summary = json.loads((tmp_path / "Treasury-BOT" / "summary.json").read_text())
    summary["p95"] = 1000
    summary["pass_p95"] = False
    (tmp_path / "Treasury-BOT" / "summary.json").write_text(json.dumps(summary))
    slo_report.build_report()
    md = (tmp_path / "_index.md").read_text()
    assert "False" in md
