"""Compliance checklist endpoints."""

from datetime import datetime
from typing import Dict

from fastapi import APIRouter

from ...schemas import ComplianceAcknowledgement, ComplianceChecklist, ComplianceItem

router = APIRouter()


_PROVIDER_CHECKLISTS: Dict[str, ComplianceChecklist] = {
    "aws": ComplianceChecklist(
        provider="aws",
        version="2024-05",
        last_reviewed_at=datetime(2024, 5, 1, 0, 0, 0),
        items=[
            ComplianceItem(
                key="tos",
                label="Review AWS EC2/ECS acceptable use policy",
                description="Confirm workloads comply with AWS AUP and regional regulations.",
            ),
            ComplianceItem(
                key="ports",
                label="No inbound ports",
                description="Tasks must not expose inbound network ports; outbound-only enforced.",
            ),
            ComplianceItem(
                key="runtime",
                label="Ephemeral runtime",
                description="Jobs must terminate within the configured runtime cap (<= 120 minutes).",
            ),
        ],
    )
}


@router.get("/{provider}", response_model=ComplianceChecklist)
async def get_checklist(provider: str) -> ComplianceChecklist:
    """Return the compliance checklist for a provider."""

    return _PROVIDER_CHECKLISTS[provider]


@router.post("/{provider}/ack", response_model=ComplianceAcknowledgement)
async def acknowledge(provider: str, org_id: str, user_id: str) -> ComplianceAcknowledgement:
    """Record a compliance acknowledgement. Persistence will be added later."""

    checklist = _PROVIDER_CHECKLISTS[provider]
    now = datetime.utcnow()
    return ComplianceAcknowledgement(
        org_id=org_id,
        provider=provider,
        version=checklist.version,
        accepted_at=now,
        accepted_by=user_id,
        checklist=checklist,
    )
