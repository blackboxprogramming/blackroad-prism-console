import os
from redis.asyncio import Redis

_redis: Redis | None = None


async def get_redis() -> Redis:
    """Return a singleton Redis client."""
    global _redis
    if _redis is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis = Redis.from_url(url)
    return _redis
