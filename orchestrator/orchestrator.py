from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Dict, List

from .protocols import Response, Task


class Orchestrator:
    """Routes tasks to registered bots and logs all actions."""

    def __init__(self, memory_path: str | Path = "memory.jsonl") -> None:
        self.bots: Dict[str, Any] = {}
        self.tasks: Dict[str, Task] = {}
        self.responses: Dict[str, Response] = {}
        self.memory_path = Path(memory_path)

    # Bot management -------------------------------------------------
    def register_bot(self, domain: str, bot: Any) -> None:
        self.bots[domain] = bot

    # Task lifecycle -------------------------------------------------
    def create_task(self, description: str, domain: str, metadata: Dict[str, Any] | None = None) -> Task:
        task = Task(id=str(uuid.uuid4()), description=description, domain=domain, metadata=metadata or {})
        if task.metadata.get("allow_network"):
            raise ValueError("Network calls are disallowed by guardrails")
        self.tasks[task.id] = task
        self._log({"event": "task_created", "task": task.__dict__})
        return task

    def route(self, task_id: str) -> Response:
        task = self.tasks[task_id]
        bot = self.bots.get(task.domain)
        if not bot:
            response = Response(task_id=task.id, status="error", data=f"No bot for domain {task.domain}")
        else:
            response = bot.run(task)
        self.responses[task.id] = response
        self._log({"event": "task_routed", "task_id": task.id, "response": response.__dict__})
        return response

    def list_tasks(self) -> List[Task]:
        return list(self.tasks.values())

    def get_status(self, task_id: str) -> Response | None:
        return self.responses.get(task_id)

    # Internal logging -----------------------------------------------
    def _log(self, record: Dict[str, Any]) -> None:
        with self.memory_path.open("a") as fh:
            fh.write(json.dumps(record) + "\n")
