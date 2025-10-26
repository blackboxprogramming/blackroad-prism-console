from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..models import BulkIndexRequest, BulkIndexResponse, CuratedSeedResponse
from ..observability.metrics import index_docs_total
from ..repo import bulk_index, get_session

router = APIRouter(tags=["ingest"])


@router.post("/index/bulk", response_model=BulkIndexResponse)
async def index_bulk(payload: BulkIndexRequest) -> BulkIndexResponse:
    if not payload.docs:
        return BulkIndexResponse(indexed=0)
    async with get_session() as session:
        indexed = await bulk_index(session, payload.docs)
    index_docs_total.inc(indexed)
    return BulkIndexResponse(indexed=indexed)


@router.post("/index/curated-seed", response_model=CuratedSeedResponse)
async def index_curated_seed() -> CuratedSeedResponse:
    fixture_path = Path(__file__).resolve().parents[3] / "fixtures" / "curated_seed.json"
    if not fixture_path.exists():
        raise HTTPException(status_code=500, detail="Curated seed missing")
    data = json.loads(fixture_path.read_text())
    request_model = BulkIndexRequest.model_validate(data)
    async with get_session() as session:
        indexed = await bulk_index(session, request_model.docs)
    index_docs_total.inc(indexed)
    return CuratedSeedResponse(indexed=indexed)
