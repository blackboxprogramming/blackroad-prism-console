from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Agent(BaseModel):
    id: str
    name: str
    domain: str
    status: Literal["online", "degraded", "offline"]
    memoryUsedMB: float
    lastSeenAt: datetime
    version: str


class AgentEvent(BaseModel):
    id: str
    agentId: str
    kind: Literal["started", "heartbeat", "warn", "error", "completed"]
    at: datetime
    message: str


class AgentListResponse(BaseModel):
    items: list[Agent]


class AgentDetailResponse(BaseModel):
    agent: Agent
    recent: list[AgentEvent]


__all__ = [
    "Agent",
    "AgentEvent",
    "AgentListResponse",
    "AgentDetailResponse",
]
