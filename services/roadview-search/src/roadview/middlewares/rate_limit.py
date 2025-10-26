from __future__ import annotations

import time
from collections import defaultdict
from typing import DefaultDict

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..config import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):  # type: ignore[override]
        super().__init__(app)
        self.allowance: DefaultDict[str, list[float]] = defaultdict(lambda: [settings.rate_limit_per_minute, time.time()])

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        identifier = request.client.host if request.client else "unknown"
        if identifier in {"testclient", "127.0.0.1"} and settings.env == "dev":
            return await call_next(request)
        quota, last_check = self.allowance[identifier]
        current = time.time()
        elapsed = current - last_check
        quota = min(settings.rate_limit_per_minute, quota + elapsed * (settings.rate_limit_per_minute / 60.0))
        if quota < 1:
            raise HTTPException(status_code=429, detail="Too many requests")
        quota -= 1
        self.allowance[identifier] = [quota, current]
        return await call_next(request)
