"""Simple in-memory rate limiting utilities."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple


class RateLimitExceeded(RuntimeError):
    """Raised when a caller exceeds an endpoint's configured rate limit."""

    def __init__(self, retry_after: float) -> None:
        super().__init__("Rate limit exceeded")
        self.retry_after = retry_after


class InMemoryRateLimiter:
    """Naïve in-memory rate limiter keyed by caller identifier."""

    def __init__(self) -> None:
        self._hits: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def hit(self, key: Tuple[str, str], limit: int, window_seconds: int) -> None:
        """Record a hit for ``key`` and raise ``RateLimitExceeded`` if it is over the limit."""

        now = time.monotonic()
        async with self._lock:
            hits = self._hits[key]
            threshold = now - window_seconds
            while hits and hits[0] <= threshold:
                hits.popleft()

            if len(hits) >= limit:
                retry_after = hits[0] + window_seconds - now
                raise RateLimitExceeded(max(retry_after, 0.0))

            hits.append(now)

    async def reset(self, key: Tuple[str, str]) -> None:
        """Clear the hit counter for ``key``."""

        async with self._lock:
            self._hits.pop(key, None)
