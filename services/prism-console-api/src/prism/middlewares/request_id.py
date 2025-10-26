from __future__ import annotations

import uuid
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    header_name = "X-Request-ID"

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:  # type: ignore[override]
        request_id = request.headers.get(self.header_name, str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers.setdefault(self.header_name, request_id)
        return response


__all__ = ["RequestIDMiddleware"]
