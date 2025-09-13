from bench import runner
from orchestrator import orchestrator
from tests.test_bench_runner import make_timer


def test_cache_impact_delta(tmp_path, monkeypatch):
    monkeypatch.setattr(runner, "ARTIFACTS", tmp_path)
    monkeypatch.setattr(runner, "METRICS_PATH", tmp_path / "metrics.jsonl")
    monkeypatch.setattr(orchestrator, "_memory_path", tmp_path / "mem.jsonl")
    # first run (baseline)
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 30, 30, 30]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1, cache="off")
    # second run (faster)
    monkeypatch.setattr(orchestrator, "perf_timer", make_timer([5, 10, 10, 10]))
    runner.run_bench("Treasury-BOT", iterations=3, warmup=1, cache="on")
    delta_path = tmp_path / "Treasury-BOT" / "cache_savings.md"
    assert delta_path.exists()
    text = delta_path.read_text()
    assert "mean_ms" in text
