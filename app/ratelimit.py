from __future__ import annotations

import asyncio
import time
from typing import Dict, Tuple

try:  # pragma: no cover - optional dependency
    import aioredis  # type: ignore # noqa: F401
except Exception:  # pragma: no cover - optional dependency
    aioredis = None


class TokenBucket:
    def __init__(self, rate_per_min: int, burst: int):
        self.rate = max(rate_per_min, 1) / 60.0
        self.burst = max(burst, 1)
        self.tokens = float(self.burst)
        self.ts = time.monotonic()
        self.lock = asyncio.Lock()

    async def take(self, n: int = 1) -> Tuple[bool, float]:
        async with self.lock:
            now = time.monotonic()
            self.tokens = min(self.burst, self.tokens + (now - self.ts) * self.rate)
            self.ts = now
            if self.tokens >= n:
                self.tokens -= n
                return True, 0.0
            short = (n - self.tokens) / self.rate if self.rate else float("inf")
            return False, short


_buckets: Dict[str, TokenBucket] = {}


def _bucket(key: str, rate: int, burst: int) -> TokenBucket:
    bucket = _buckets.get(key)
    if bucket is None:
        bucket = TokenBucket(rate, burst)
        _buckets[key] = bucket
    return bucket


def reset_buckets() -> None:
    _buckets.clear()
