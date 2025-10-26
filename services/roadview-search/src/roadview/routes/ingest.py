from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import SQLModel

from ..config import Settings, get_settings
from ..models import (
    BulkIndexResponse,
    Domain,
    DomainResponse,
    DomainUpsert,
    IndexRequestDocument,
)
from ..observability import metrics
from ..repo import RoadviewRepository

router = APIRouter()


def get_repository(request: Request) -> RoadviewRepository:
    return request.app.state.repository


class BulkIndexRequest(SQLModel):
    docs: list[IndexRequestDocument]


@router.post("/api/index/bulk", response_model=BulkIndexResponse)
async def bulk_index(
    payload: BulkIndexRequest,
    repo: RoadviewRepository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
) -> BulkIndexResponse:
    indexed = await repo.bulk_index_documents(payload.docs)
    if indexed:
        metrics.INDEX_DOCS_TOTAL.inc(indexed)
    return BulkIndexResponse(indexed=indexed)


@router.post("/api/index/curated-seed", response_model=BulkIndexResponse)
async def curated_seed(
    request: Request,
    repo: RoadviewRepository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
) -> BulkIndexResponse:
    if settings.env != "dev":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not available")
    seed_path: Path = request.app.state.curated_seed_path
    indexed = await repo.curated_seed_count(str(seed_path))
    if indexed:
        metrics.INDEX_DOCS_TOTAL.inc(indexed)
    return BulkIndexResponse(indexed=indexed)


@router.get("/api/domains")
async def list_domains(
    repo: RoadviewRepository = Depends(get_repository),
) -> dict[str, list[Domain]]:
    domains = await repo.list_domains()
    return {"items": domains}


@router.post("/api/domains", response_model=DomainResponse)
async def upsert_domain(
    payload: DomainUpsert,
    repo: RoadviewRepository = Depends(get_repository),
) -> DomainResponse:
    domain, created = await repo.upsert_domain(Domain(**payload.dict()))
    if created:
        metrics.DOMAINS_TOTAL.inc()
    return DomainResponse(domain=domain)
