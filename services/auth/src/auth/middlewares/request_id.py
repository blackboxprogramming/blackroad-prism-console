from __future__ import annotations

import time
import uuid
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..observability.logging import request_logger
from ..observability.metrics import REQUEST_COUNT, REQUEST_DURATION


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        start = time.perf_counter()
        request.state.request_id = request_id
        response = await call_next(request)
        duration = time.perf_counter() - start
        response.headers["x-request-id"] = request_id
        route = request.url.path
        REQUEST_COUNT.labels(route=route, method=request.method, status=str(response.status_code)).inc()
        REQUEST_DURATION.labels(route=route).observe(duration)
        logger = request_logger({"request_id": request_id, "route": route})
        logger.info("request.complete", method=request.method, status=response.status_code, duration_ms=int(duration * 1000))
        return response
