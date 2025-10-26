from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid.uuid4()))
        request.state.request_id = request_id
        response: Response = await call_next(request)
        response.headers.setdefault(REQUEST_ID_HEADER, request_id)
        return response
