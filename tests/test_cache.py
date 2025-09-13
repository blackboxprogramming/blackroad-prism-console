from __future__ import annotations

import time

from orchestrator.cache import Cache


def key_fn(d: dict) -> str:
    return str(sorted(d.items()))


def test_cache_memory_hit_miss_ttl(tmp_path):
    cache = Cache(get_key=key_fn, ttl_seconds=1, backend="memory")
    params = {"a": 1}
    assert cache.get(params) is None
    cache.set(params, 10)
    assert cache.get(params) == 10
    time.sleep(1.1)
    assert cache.get(params) is None
    stats = cache.stats()
    assert stats["cache_hit"] == 1
    assert stats["cache_miss"] == 2
    assert stats["cache_write"] == 1


def test_cache_file_backend(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    cache = Cache(get_key=key_fn, ttl_seconds=100, backend="file")
    params = {"x": 1}
    cache.set(params, 5)
    assert cache.get(params) == 5
    cache.clear()
    assert cache.get(params) is None
