"""Protocol models shared across orchestrator and bot implementations."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class Task(BaseModel):
    """Canonical representation of a unit of work for a bot."""

    id: str
    description: str
    goal: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    created_at: datetime


class Response(BaseModel):
    """Lightweight response envelope used by legacy bots."""

    task_id: str
    status: str
    data: Dict[str, Any]
    message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BotResponse(BaseModel):
    """Structured response used by BaseBot implementations."""

    task_id: str
    summary: str
    steps: List[str]
    data: Dict[str, Any]
    risks: List[str]
    artifacts: List[str]
    next_actions: List[str]
    ok: bool
    elapsed_ms: Optional[int] = None
    rss_mb: Optional[int] = None
    slo_name: Optional[str] = None
    p50_target: Optional[int] = None
    p95_target: Optional[int] = None
    max_mem_mb: Optional[int] = None
    memory_ops: Optional[List[Dict[str, Any]]] = None
