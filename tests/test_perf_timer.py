import time

from orchestrator.perf import perf_timer


def test_perf_timer_elapsed_and_rss_non_negative():
    with perf_timer("t") as p:
        time.sleep(0.01)
    assert p["elapsed_ms"] >= 10
    assert p["rss_mb"] is None or p["rss_mb"] >= 0
