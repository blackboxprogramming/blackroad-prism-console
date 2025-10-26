from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class Runbook(BaseModel):
    id: str
    title: str
    description: str
    tags: list[str]
    inputsSchema: dict[str, Any]
    linkedWorkflow: str


class RunbookListResponse(BaseModel):
    items: list[Runbook]


class RunbookResponse(BaseModel):
    runbook: Runbook


class RunbookExecuteRequest(BaseModel):
    input: dict[str, Any] | None = None
    idempotencyKey: str | None = None


class RunbookExecuteResponse(BaseModel):
    runId: str
    accepted: bool


__all__ = [
    "Runbook",
    "RunbookListResponse",
    "RunbookResponse",
    "RunbookExecuteRequest",
    "RunbookExecuteResponse",
]
