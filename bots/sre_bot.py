from __future__ import annotations

from orchestrator.base import BaseBot
from orchestrator.flags import get_flag
from orchestrator.protocols import BotResponse, Task


class SREBot(BaseBot):
    name = "SRE-BOT"
    mission = "Create postmortem outlines"

    def run(self, task: Task) -> BotResponse:
        if get_flag("bot.SRE-BOT.postmortem_v2", False):
            summary = "Postmortem v2 skeleton"
            steps = ["collect metrics", "draft timeline"]
        else:
            summary = "Postmortem v1 skeleton"
            steps = ["gather logs"]
        return BotResponse(
            task_id=task.id,
            summary=summary,
            steps=steps,
            data={},
            risks=["none"],
            artifacts=["pm.md"],
            next_actions=["review"],
            ok=True,
        )
