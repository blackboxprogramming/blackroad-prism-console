from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models import DomainListResponse, DomainResponse, DomainUpsert, PolicyEnum
from ..observability.metrics import domains_total
from ..repo import get_domain, get_session, list_domains, upsert_domain

router = APIRouter(tags=["domains"])


@router.get("/domains", response_model=DomainListResponse)
async def get_domains() -> DomainListResponse:
    async with get_session() as session:
        items = await list_domains(session)
    return DomainListResponse(items=items)


@router.post("/domains", response_model=DomainResponse)
async def post_domain(payload: DomainUpsert) -> DomainResponse:
    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Domain name required")
    async with get_session() as session:
        existing = await get_domain(session, payload.name)
        domain = await upsert_domain(
            session,
            payload.name,
            display_name=payload.displayName,
            bias=payload.bias,
            base_cred=payload.baseCred,
            policy=payload.policy,
        )
        if existing is None:
            domains_total.inc()
    return DomainResponse(domain=domain)
