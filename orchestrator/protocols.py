from datetime import datetime
from typing import Dict, List, Optional

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
    elapsed_ms: Optional[int] = None
    rss_mb: Optional[int] = None
    slo_name: Optional[str] = None
    p50_target: Optional[int] = None
    p95_target: Optional[int] = None
    max_mem_mb: Optional[int] = None
