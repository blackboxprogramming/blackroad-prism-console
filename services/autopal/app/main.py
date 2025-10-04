"""FastAPI application exposing the AutoPal secret materialization flow."""

from __future__ import annotations

from typing import Any, Dict, Tuple

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.responses import JSONResponse

from .auth import TokenVerificationError, get_token_verifier
from .config import settings
from .ratelimit import InMemoryRateLimitBackend, RateLimitExceeded, RateLimiter

try:
    from .ratelimit_redis import create_redis_backend
except RuntimeError:
    create_redis_backend = None  # type: ignore[assignment]


def _build_rate_limiter() -> RateLimiter:
    if settings.redis_url and create_redis_backend is not None:
        backend = create_redis_backend(settings.redis_url)
    else:
        backend = InMemoryRateLimitBackend()
    return RateLimiter(
        limit=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
        backend=backend,
    )


app = FastAPI(title="AutoPal", version="1.0.0")
_rate_limiter = _build_rate_limiter()


async def verify_request(
    authorization: str = Header(..., alias="Authorization"),
    audience: str = Header(..., alias=settings.audience_header),
) -> Tuple[Dict[str, Any], str]:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token")
    verifier = get_token_verifier()
    try:
        claims = verifier.verify(token, audience)
    except TokenVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token") from exc
    return claims, audience


@app.get("/healthz")
async def healthcheck() -> Dict[str, str]:
    """Lightweight readiness probe."""

    return {"status": "ok"}


@app.post("/secrets/materialize")
async def materialize_secret(
    token_ctx: Tuple[Dict[str, Any], str] = Depends(verify_request),
    step_up_approved: str | None = Header(None, alias=settings.step_up_header),
) -> JSONResponse:
    claims, audience = token_ctx
    subject = claims.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="missing_subject")

    key = f"{subject}::{audience}"
    try:
        await _rate_limiter.check(key)
    except RateLimitExceeded as exc:
        headers = {"Retry-After": str(exc.retry_after)}
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="rate_limit_exceeded",
            headers=headers,
        ) from exc

    if not step_up_approved or step_up_approved.lower() != "true":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="step_up_required")

    payload = {
        "subject": subject,
        "audience": audience,
        "materialized": True,
        "secrets": {
            "api_token": "mock-secret-token",
            "ttl_seconds": settings.rate_limit_window_seconds,
        },
    }
    return JSONResponse(payload)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await _rate_limiter.close()
