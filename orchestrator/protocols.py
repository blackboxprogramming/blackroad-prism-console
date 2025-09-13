from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel


class Task(BaseModel):
    id: str
    goal: str
    context: Optional[Dict] = None
    created_at: datetime


class BotResponse(BaseModel):
    task_id: str
    summary: str
    steps: List[str]
    data: Dict
    risks: List[str]
    artifacts: List[str]
    next_actions: List[str]
    ok: bool
