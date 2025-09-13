import contextlib
import json

from bench import runner
from orchestrator import orchestrator


def make_timer(values):
    def _timer(label):
        val = values.pop(0)
        @contextlib.contextmanager
        def cm():
            data = {"elapsed_ms": val, "rss_mb": 1}
            yield data
        return cm()
    return _timer


def test_run_bench_creates_artifacts(tmp_path, monkeypatch):
    monkeypatch.setattr(runner, "ARTIFACTS", tmp_path)
    monkeypatch.setattr(runner, "METRICS_PATH", tmp_path / "metrics.jsonl")
    monkeypatch.setattr(orchestrator, "_memory_path", tmp_path / "mem.jsonl")
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 20, 30, 40]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1)
    summary = json.loads((tmp_path / "Treasury-BOT" / "summary.json").read_text())
    assert summary["p50"] == 30
    assert summary["p95"] == 39
    assert summary["iterations"] == 3
    assert (tmp_path / "Treasury-BOT" / "timings.csv").exists()
