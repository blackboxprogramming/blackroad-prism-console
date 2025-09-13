from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List

from tools import storage
from . import approvals
from .exceptions import BotExecutionError
from security.rbac import User

TASKS_PATH = "orchestrator/tasks.jsonl"


@dataclass
class Task:
    id: str
    goal: str
    context: Dict
    status: str = "created"
    bot: str | None = None


def _load_all() -> List[Task]:
    entries = storage.read_jsonl(TASKS_PATH)
    return [Task(**e) for e in entries]


def _save_all(items: List[Task]) -> None:
    storage.write_text(TASKS_PATH, "", from_data=True)
    for item in items:
        storage.append_jsonl(TASKS_PATH, asdict(item))


def create_task(goal: str, context: Dict, *, user: User) -> Task:
    items = _load_all()
    next_id = f"T{len(items)+1:04d}"
    task = Task(id=next_id, goal=goal, context=context)
    items.append(task)
    _save_all(items)
    return task


def route_task(task_id: str, bot: str, *, user: User) -> Task:
    items = _load_all()
    task = next((t for t in items if t.id == task_id), None)
    if not task:
        raise BotExecutionError("task_not_found")
    # load approval rules
    rules = storage.read_yaml("approvals.yaml")
    required_roles: List[str] = []
    for rule in rules.get("rules", []):
        match = rule.get("match", {})
        if match.get("bot") == bot:
            intent = match.get("intent")
            if intent and task.context.get("intent") != intent:
                continue
            required_roles = rule.get("approver_roles", [])
            break
    if required_roles and not approvals.has_approval(task.id, required_roles):
        raise BotExecutionError("approval_required")
    task.bot = bot
    task.status = "routed"
    _save_all(items)
    return task


def task_status(task_id: str) -> Task | None:
    items = _load_all()
    return next((t for t in items if t.id == task_id), None)
