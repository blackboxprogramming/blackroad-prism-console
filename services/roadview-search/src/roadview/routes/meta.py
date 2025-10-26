from __future__ import annotations

import time
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import generate_latest

from ..config import Settings, get_settings
from ..repo import RoadviewRepository

router = APIRouter()


def get_repository(request: Request) -> RoadviewRepository:
    return request.app.state.repository


@router.get("/health")
async def health(
    request: Request,
    repo: RoadviewRepository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
) -> Dict[str, Any]:
    uptime = time.time() - request.app.state.start_time
    corpus = await repo.get_corpus_size()
    domains = await repo.get_domains_count()
    return {
        "status": "ok",
        "uptime": uptime,
        "version": "0.1.0",
        "corpusSize": corpus,
        "domains": domains,
    }


@router.get("/metrics")
async def metrics_endpoint(settings: Settings = Depends(get_settings)):
    if not settings.metrics_enabled:
        return PlainTextResponse("metrics disabled", status_code=404)
    return PlainTextResponse(generate_latest().decode("utf-8"))


@router.get("/openapi.json")
async def openapi(request: Request):
    return JSONResponse(request.app.openapi())
