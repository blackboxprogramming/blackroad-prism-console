"""Rate limiting primitives for the AutoPal service."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Protocol, Tuple


class RateLimitBackend(Protocol):
    """Protocol implemented by rate-limit storage backends."""

    async def increment(self, key: str, window_seconds: int) -> Tuple[int, int]:
        """Increment the request counter and return the new count and TTL in seconds."""

    async def close(self) -> None:
        """Release any backend resources."""


class RateLimitExceeded(Exception):
    """Raised when a caller exceeds the configured rate limit."""

    def __init__(self, retry_after: int) -> None:
        super().__init__("Rate limit exceeded")
        self.retry_after = max(1, retry_after)


@dataclass(slots=True)
class RateLimiter:
    """Apply rate limiting to per-subject keys."""

    limit: int
    window_seconds: int
    backend: RateLimitBackend

    async def check(self, key: str) -> None:
        count, ttl = await self.backend.increment(key, self.window_seconds)
        if count > self.limit:
            raise RateLimitExceeded(ttl or self.window_seconds)

    async def close(self) -> None:
        await self.backend.close()


class InMemoryRateLimitBackend:
    """Simple in-process sliding window counter."""

    def __init__(self) -> None:
        self._entries: dict[str, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def increment(self, key: str, window_seconds: int) -> Tuple[int, int]:
        async with self._lock:
            now = time.monotonic()
            count, expires_at = self._entries.get(key, (0, 0.0))
            if now >= expires_at:
                count = 0
                expires_at = now + window_seconds
            count += 1
            self._entries[key] = (count, expires_at)
            ttl = max(0, int(round(expires_at - now)))
            return count, ttl

    async def close(self) -> None:
        self._entries.clear()
