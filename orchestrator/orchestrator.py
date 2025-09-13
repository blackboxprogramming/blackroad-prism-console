from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict

from bots import BOT_REGISTRY, BaseBot
from orchestrator.protocols import BotResponse, Task


class Orchestrator:
    """Routes tasks to bots and logs interactions."""

    def __init__(
        self, base_path: Path | None = None, bots: Dict[str, BaseBot] | None = None
    ) -> None:
        self.base_path = base_path or Path(__file__).resolve().parent.parent
        self.memory_path = self.base_path / "memory.jsonl"
        self.artifacts_dir = self.base_path / "artifacts"
        self.artifacts_dir.mkdir(exist_ok=True)
        self.bots = bots or BOT_REGISTRY

    def route(self, task: Task, bot_name: str) -> BotResponse:
        bot = self.bots[bot_name]
        response = bot.run(task)
        self._log(
            {"type": "response", "task_id": task.id, "bot": bot_name, "response": response.dict()}
        )
        artifact_dir = self.artifacts_dir / task.id
        artifact_dir.mkdir(parents=True, exist_ok=True)
        with open(artifact_dir / "response.json", "w") as fh:
            json.dump(response.dict(), fh, indent=2)
        self.red_team(response)
        return response

    def red_team(self, response: BotResponse) -> None:
        if not response.risks_gaps:
            raise ValueError("Risks/Gaps must be provided")

    def _log(self, entry: Dict) -> None:
        entry["timestamp"] = datetime.utcnow().isoformat()
        with open(self.memory_path, "a") as fh:
            fh.write(json.dumps(entry) + "\n")
