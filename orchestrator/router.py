"""Routing helpers for executing tasks with bots."""

from __future__ import annotations

from typing import List

from .metrics import log_metric
from .protocols import BotExecutionError, Task


def dependencies_met(task: Task, tasks: List[Task]) -> bool:
    done_ids = {t.id for t in tasks if t.status == "done"}
    return all(dep in done_ids for dep in task.depends_on)


def route_task(task: Task, tasks: List[Task]) -> None:
    from bots import BOT_REGISTRY

    if not dependencies_met(task, tasks):
        log_metric("dependency_block", task.id)
        raise BotExecutionError("dependencies_not_met")

    bot = BOT_REGISTRY.get(task.bot)
    if bot is None:
        raise BotExecutionError("bot_not_found")

    bot.run(task)
    task.status = "done"
    log_metric("scheduled_run", task.id)

