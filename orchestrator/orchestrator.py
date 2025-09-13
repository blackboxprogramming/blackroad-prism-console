from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from uuid import uuid4

from config.settings import settings
from tools.storage import write_json, write_text

from .base import BotResponse, Task
from .errors import BotExecutionError
from .logging import log
from .metrics import record
from .registry import get


def create_task(goal: str, context: dict | None = None) -> Task:
    task = Task(id=str(uuid4()), goal=goal, context=context or {})
    record("task_created", task_id=task.id)
    return task


def route_task(task: Task, bot_name: str) -> BotResponse:
    bot = get(bot_name)
    record("task_routed", task_id=task.id, bot=bot_name)
    log({"event": "task_routed", "task_id": task.id, "bot": bot_name})
    try:
        resp = bot.run(task)
    except Exception as exc:  # pragma: no cover - delegated
        record("bot_failure", task_id=task.id, bot=bot_name)
        raise BotExecutionError(bot=bot_name, task_id=task.id, reason=str(exc)) from exc
    if not resp.summary or bot_name not in resp.summary:
        raise BotExecutionError(bot=bot_name, task_id=task.id, reason="invalid summary")
    if not resp.risks:
        raise BotExecutionError(bot=bot_name, task_id=task.id, reason="risks missing")
    record("bot_success", task_id=task.id, bot=bot_name)
    artifact_dir = Path(settings.ARTIFACTS_DIR) / task.id
    write_json(artifact_dir / f"{bot_name.lower()}_response.json", asdict(resp))
    write_text(artifact_dir / f"{bot_name.lower()}_summary.md", resp.summary)
    return resp
