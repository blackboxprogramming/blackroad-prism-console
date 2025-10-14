"""Redis-backed rate limiting for AutoPal."""

from __future__ import annotations

from typing import Tuple

try:
    import redis.asyncio as redis  # type: ignore
except ModuleNotFoundError as exc:  # pragma: no cover - handled at runtime
    raise RuntimeError(
        "redis-py is required for the Redis rate limit backend"
    ) from exc

from .ratelimit import RateLimitBackend


class RedisRateLimitBackend(RateLimitBackend):
    """Redis implementation for distributed rate limiting."""

    def __init__(self, url: str) -> None:
        self._client = redis.from_url(url, decode_responses=True)

    async def increment(self, key: str, window_seconds: int) -> Tuple[int, int]:
        count = await self._client.incr(key)
        if count == 1:
            await self._client.expire(key, window_seconds)
            ttl = window_seconds
        else:
            ttl = await self._client.ttl(key)
            if ttl < 0:
                await self._client.expire(key, window_seconds)
                ttl = window_seconds
        return count, max(0, ttl)

    async def close(self) -> None:
        await self._client.aclose()


def create_redis_backend(url: str) -> RedisRateLimitBackend:
    """Factory helper used by the service wiring."""

    return RedisRateLimitBackend(url)
