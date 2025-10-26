from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Callable, Deque, Dict, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from ..observability.metrics import RATE_LIMIT_BLOCK_TOTAL


@dataclass
class RateLimitRule:
    limit: int
    per_seconds: int


class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, rules: Dict[str, RateLimitRule]):
        super().__init__(app)
        self.rules = rules
        self.buckets: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        rule = self.rules.get(request.url.path)
        if not rule:
            return await call_next(request)
        identifier = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - rule.per_seconds
        bucket = self.buckets[(request.url.path, identifier)]
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= rule.limit:
            RATE_LIMIT_BLOCK_TOTAL.labels(route=request.url.path).inc()
            retry_after = max(0, int(bucket[0] + rule.per_seconds - now)) if bucket else rule.per_seconds
            return JSONResponse(
                status_code=429,
                content={
                    "type": "about:blank",
                    "title": "Too Many Requests",
                    "detail": "Rate limit exceeded",
                    "status": 429,
                },
                headers={"Retry-After": str(retry_after)},
            )
        bucket.append(now)
        return await call_next(request)
