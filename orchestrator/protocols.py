"""Protocols and dataclasses for task orchestration."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


class BotExecutionError(Exception):
    """Raised when a bot cannot execute a task."""

    def __init__(self, reason: str, details: Any | None = None):
        super().__init__(reason)
        self.reason = reason
        self.details = details


@dataclass
class Task:
    id: str
    goal: str
    bot: str
    context: Dict[str, Any] = field(default_factory=dict)
    status: str = "pending"
    depends_on: List[str] = field(default_factory=list)
    scheduled_for: Optional[datetime] = None


@runtime_checkable
class BaseBot(Protocol):
    NAME: str
    SUPPORTED_TASKS: List[str]

    def run(self, task: Task) -> Any:  # pragma: no cover - implementation specific
        ...

