from pathlib import Path

from bench.runner import run_cache_experiment


def test_cache_experiment_writes_delta():
    path = run_cache_experiment("Treasury-BOT", iterations=3, warmup=1)
    content = Path(path).read_text()
    assert "speedup" in content
