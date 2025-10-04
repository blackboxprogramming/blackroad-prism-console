"""Pydantic schemas for Autopal endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field

from .breakglass import BreakGlassContext


class MaterializeRequest(BaseModel):
    secret_id: str = Field(..., description="Identifier of the secret to materialize")
    reason: str | None = Field(None, description="Optional justification for the request")


class FossilOverrideRequest(BaseModel):
    fossil_id: str = Field(..., description="Fossil job identifier")
    requested_by: str = Field(..., description="Requester issuing the override")


class ApprovalRequest(BaseModel):
    actor: str = Field(..., description="Person or service approving the request")
    notes: str | None = Field(None, description="Optional approval notes")


class OperationResponse(BaseModel):
    status: str
    detail: str | None = None
    break_glass: dict[str, object] | None = Field(
        default=None,
        description="Context describing the accepted break-glass token, if any.",
    )

    @classmethod
    def from_context(cls, status: str, detail: str | None, context: BreakGlassContext | None) -> "OperationResponse":
        return cls(status=status, detail=detail, break_glass=context.as_dict() if context else None)


__all__ = [
    "ApprovalRequest",
    "FossilOverrideRequest",
    "MaterializeRequest",
    "OperationResponse",
]
