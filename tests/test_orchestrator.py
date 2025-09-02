import time

from lucidia.orchestrator import run_shards


def test_run_shards_completes_all():
    def job(shard_id: int) -> int:
        time.sleep(0.01)
        return shard_id

    results, errors = run_shards(job, num_shards=10, timebox_seconds=5)
    assert len(results) == 10
    assert errors == {}


def test_run_shards_timebox():
    def job(shard_id: int) -> int:
        if shard_id == 0:
            time.sleep(0.2)
        else:
            time.sleep(0.01)
        return shard_id

    results, errors = run_shards(job, num_shards=10, timebox_seconds=0.05)
    assert 0 not in results
    assert 0 in errors
