from __future__ import annotations

import time
from typing import Callable

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from starlette.responses import JSONResponse

from .config import get_settings
from .middlewares.cors import apply_cors
from .middlewares.rate_limit import RateLimitMiddleware
from .middlewares.request_id import RequestIDMiddleware
from .middlewares.security_headers import SecurityHeadersMiddleware
from .observability.logging import bind_request, configure_logging
from .observability.metrics import search_requests_total
from .repo import init_db
from .routes import domains, ingest, meta, search

settings = get_settings()
configure_logging()

app = FastAPI(title="RoadView Search Service", version="0.1.0", openapi_version="3.0.3")
app.openapi_version = "3.0.3"

app.include_router(search.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")
app.include_router(domains.router, prefix="/api")
app.include_router(meta.router)

apply_cors(app)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.middleware("http")
async def logging_middleware(request: Request, call_next: Callable):
    start = time.perf_counter()
    status = "500"
    try:
        response = await call_next(request)
        status = str(response.status_code)
        return response
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger = bind_request(search.logger, route=request.url.path, method=request.method, status=status)
        logger.info(
            "request.completed",
            request_id=getattr(request.state, "request_id", None),
            took_ms=round(duration, 2),
        )
        if request.url.path.startswith("/api/search"):
            search_requests_total.labels(status=status).inc()


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    pass


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger = bind_request(search.logger, route=request.url.path, method=request.method)
    logger.exception("request.failed", error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

