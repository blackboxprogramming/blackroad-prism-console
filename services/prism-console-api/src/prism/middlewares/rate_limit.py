from __future__ import annotations

import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class TokenBucket:
    def __init__(self, capacity: int, fill_rate: float) -> None:
        self.capacity = capacity
        self.fill_rate = fill_rate
        self.tokens = capacity
        self.timestamp = time.monotonic()

    def consume(self, tokens: int = 1) -> bool:
        now = time.monotonic()
        delta = now - self.timestamp
        self.timestamp = now
        self.tokens = min(self.capacity, self.tokens + delta * self.fill_rate)
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 120, window_seconds: int = 60) -> None:  # type: ignore[override]
        super().__init__(app)
        self.limit = limit
        self.window_seconds = window_seconds
        self.buckets: dict[str, TokenBucket] = {}

    def _bucket_key(self, request: Request) -> str:
        token = request.headers.get("Authorization", "anonymous")
        host = request.client.host if request.client else "unknown"
        return f"{host}:{token}"

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:  # type: ignore[override]
        key = self._bucket_key(request)
        bucket = self.buckets.setdefault(key, TokenBucket(self.limit, self.limit / self.window_seconds))
        if not bucket.consume():
            retry_after = max(1, int(bucket.capacity / bucket.fill_rate))
            return JSONResponse(
                {"type": "about:blank", "title": "Too Many Requests", "status": 429, "detail": "Rate limit exceeded."},
                status_code=429,
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)


__all__ = ["RateLimitMiddleware"]
