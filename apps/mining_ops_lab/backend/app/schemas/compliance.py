"""Compliance checklist schemas."""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class ComplianceItem(BaseModel):
    """Represents a single compliance requirement toggle."""

    key: str
    label: str
    description: str
    required: bool = True


class ComplianceChecklist(BaseModel):
    """Provider specific checklist that users must acknowledge."""

    provider: str
    version: str
    items: List[ComplianceItem]
    last_reviewed_at: datetime


class ComplianceAcknowledgement(BaseModel):
    """Acknowledgement state persisted for an organisation."""

    org_id: str
    provider: str
    version: str
    accepted_at: datetime
    accepted_by: str
    checklist: ComplianceChecklist | None = Field(
        default=None,
        description="Optional payload returned alongside ack metadata for convenience.",
    )
