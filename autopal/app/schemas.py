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


class EnvironmentRequest(BaseModel):
    """Payload to request access to a remote environment."""

    environment_name: str = Field(..., description="Name of the environment (e.g., dev, staging, production)")
    requested_by: str = Field(..., description="Identifier for the requesting operator")
    purpose: str = Field(..., description="Purpose/reason for accessing the environment")
    duration_minutes: int = Field(default=60, gt=0, le=1440, description="Access duration in minutes (max 24 hours)")
    metadata: Dict[str, str] = Field(default_factory=dict)


class EnvironmentResponse(BaseModel):
    """Response for environment access requests."""

    request_id: str
    environment_name: str
    requested_by: str
    purpose: str
    duration_minutes: int
    approved_by: Optional[str] = None
    granted_at: Optional[float] = None
    expires_at: Optional[float] = None
