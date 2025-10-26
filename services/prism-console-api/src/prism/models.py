from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Agent(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    domain: str
    status: str
    memory_used_mb: float
    last_seen_at: datetime
    version: str


class AgentEvent(SQLModel, table=True):
    id: str = Field(primary_key=True)
    agent_id: str = Field(foreign_key="agent.id")
    kind: str
    at: datetime
    message: str


class Runbook(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str
    description: str
    tags: str
    inputs_schema: str
    linked_workflow: str


class Setting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Metric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    metric_id: str
    title: str
    value: str
    caption: str
    icon: str
    status: str


__all__ = [
    "Agent",
    "AgentEvent",
    "Runbook",
    "Setting",
    "Metric",
]
