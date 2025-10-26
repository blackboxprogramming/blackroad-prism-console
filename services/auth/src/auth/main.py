from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .dependencies import init_db
from .middlewares.cors import setup_cors
from .middlewares.rate_limit import RateLimitRule, RateLimiter
from .middlewares.request_id import RequestContextMiddleware
from .middlewares.security_headers import SecurityHeadersMiddleware
from .observability.logging import configure_logging
from .routes import auth as auth_routes
from .routes import meta as meta_routes
from .routes import tokens as token_routes


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="Auth Service", version="0.1.0")
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors(app, settings)

    rate_rules = {
        "/signup": RateLimitRule(limit=max(1, settings.rate_limit_rpm // 12), per_seconds=60),
        "/login": RateLimitRule(limit=max(1, settings.rate_limit_rpm // 12), per_seconds=60),
        "/tokens/verify": RateLimitRule(limit=settings.rate_limit_rpm, per_seconds=60),
    }
    app.add_middleware(RateLimiter, rules=rate_rules)

    app.include_router(auth_routes.router)
    app.include_router(token_routes.router)
    app.include_router(meta_routes.router)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError):
        return JSONResponse(
            status_code=400,
            content={
                "type": "about:blank",
                "title": "Invalid Request",
                "detail": exc.errors(),
                "status": 400,
            },
        )

    @app.on_event("startup")
    async def on_startup():
        await init_db()

    return app


app = create_app()
