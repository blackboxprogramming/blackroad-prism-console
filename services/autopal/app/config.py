"""Configuration helpers for the AutoPal FastAPI service."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional


def _env(key: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(key)
    if value is None:
        return default
    value = value.strip()
    return value or default


def _normalize_issuer(value: str) -> str:
    value = value.strip()
    if not value.endswith("/"):
        value = f"{value}/"
    return value


@dataclass(slots=True)
class Settings:
    """Runtime configuration for the AutoPal service."""

    oidc_issuer: str
    oidc_jwks_url: str
    redis_url: Optional[str]
    rate_limit_requests: int
    rate_limit_window_seconds: int
    step_up_header: str
    audience_header: str
    cache_jwks_ttl: int
    app_host: str
    app_port: int


DEFAULT_ISSUER = _normalize_issuer(
    _env("OIDC_ISSUER", "http://localhost:8081/") or "http://localhost:8081/"
)
DEFAULT_JWKS_URL = _env(
    "OIDC_JWKS_URL", f"{DEFAULT_ISSUER.rstrip('/')}/.well-known/jwks.json"
) or "http://localhost:8081/.well-known/jwks.json"


def load_settings() -> Settings:
    """Load settings from environment variables."""

    issuer = _env("OIDC_ISSUER", DEFAULT_ISSUER)
    if not issuer:
        raise RuntimeError("OIDC_ISSUER must be provided")
    issuer = _normalize_issuer(issuer)

    jwks_url = _env("OIDC_JWKS_URL", DEFAULT_JWKS_URL)
    if not jwks_url:
        raise RuntimeError("OIDC_JWKS_URL must be provided")

    redis_url = _env("REDIS_URL")

    rate_limit_requests = int(_env("RATE_LIMIT_REQUESTS", "5") or 5)
    rate_limit_window_seconds = int(_env("RATE_LIMIT_WINDOW_SECONDS", "60") or 60)
    step_up_header = _env("STEP_UP_HEADER", "X-Step-Up-Approved") or "X-Step-Up-Approved"
    audience_header = _env("AUDIENCE_HEADER", "X-Audience") or "X-Audience"
    cache_jwks_ttl = int(_env("JWKS_CACHE_SECONDS", "300") or 300)
    app_host = _env("UVICORN_HOST", "0.0.0.0") or "0.0.0.0"
    app_port = int(_env("UVICORN_PORT", "8080") or 8080)

    return Settings(
        oidc_issuer=issuer,
        oidc_jwks_url=jwks_url,
        redis_url=redis_url,
        rate_limit_requests=rate_limit_requests,
        rate_limit_window_seconds=rate_limit_window_seconds,
        step_up_header=step_up_header,
        audience_header=audience_header,
        cache_jwks_ttl=cache_jwks_ttl,
        app_host=app_host,
        app_port=app_port,
    )


settings = load_settings()
