"""Pydantic models for the Autopal service."""

from __future__ import annotations

from typing import Dict, Optional

from pydantic import BaseModel, Field


class ApprovalRequest(BaseModel):
    """Payload to initiate a dual-control approval."""

    context: str = Field(..., description="Endpoint path this approval applies to")
    requested_by: str = Field(..., description="Identifier for the requesting operator")
    metadata: Dict[str, str] = Field(default_factory=dict)


class ApprovalResponse(BaseModel):
    """Metadata returned when creating or fetching an approval."""

    approval_id: str
    context: str
    requested_by: str
    approved_by: Optional[str] = None
    consumed_at: Optional[float] = None


class ApprovalConfirm(BaseModel):
    """Payload to confirm an existing approval."""

    approved_by: str = Field(..., description="Identifier for the second operator")


class MaterializeResponse(BaseModel):
    """Response for the materialize endpoint."""

    status: str
    approval_id: str
    secret_handle: str
