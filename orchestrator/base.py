from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Protocol


@dataclass
class Task:
    id: str
    goal: str
    context: Dict[str, Any] | None = None


@dataclass
class BotResponse:
    summary: str
    artifacts: Dict[str, Any] = field(default_factory=dict)
    risks: List[str] = field(default_factory=list)


class BaseBot(Protocol):
    """Interface that all bots must implement."""

    NAME: str
    MISSION: str
    SUPPORTED_TASKS: List[str]

    def run(self, task: Task) -> BotResponse:
        ...


__all__ = ["Task", "BotResponse", "BaseBot", "asdict"]
