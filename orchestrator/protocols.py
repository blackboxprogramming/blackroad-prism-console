from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel


class Task(BaseModel):
    """A unit of work to be processed by a bot."""

    id: str
    goal: str
    context: Optional[Dict] = None


class BotResponse(BaseModel):
    """Standard bot response envelope."""

    summary: str
    steps: List[str]
    data_assumptions: List[str]
    risks_gaps: List[str]
    artifacts: Dict[str, str]
    next_actions: List[str]
