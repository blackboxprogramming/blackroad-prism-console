from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from ..config import get_settings
from ..dependencies import get_jwt_service

router = APIRouter(tags=["meta"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "uptime": 0,
        "version": "0.1.0",
    }


@router.get("/metrics")
async def metrics():
    settings = get_settings()
    if not settings.metrics_enabled:
        return JSONResponse(status_code=404, content={"detail": "metrics disabled"})
    return PlainTextResponse(generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)


@router.get("/.well-known/jwks.json")
async def jwks():
    jwt_service = get_jwt_service()
    return jwt_service.public_jwks()
