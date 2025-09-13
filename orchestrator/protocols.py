from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class Task:
    """A unit of work to be executed by a bot."""

    id: str
    description: str
    domain: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Response:
    """A response returned by a bot after processing a task."""

    task_id: str
    status: str
    data: Any
