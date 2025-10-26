from __future__ import annotations

import time

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from starlette.responses import Response

from ..repo import count_documents, count_domains, get_session

router = APIRouter(tags=["meta"])
START_TIME = time.time()


@router.get("/health")
async def health() -> dict:
    async with get_session() as session:
        corpus = await count_documents(session)
        domains = await count_domains(session)
    return {
        "status": "ok",
        "uptime": time.time() - START_TIME,
        "version": "0.1.0",
        "corpusSize": corpus,
        "domains": domains,
    }


@router.get("/metrics", response_class=PlainTextResponse)
async def metrics() -> Response:
    payload = generate_latest()
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


@router.get("/openapi.json")
async def openapi(request: Request) -> Response:
    openapi_schema = request.app.openapi()
    return JSONResponse(content=openapi_schema)
