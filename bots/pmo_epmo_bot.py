from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class PMOEPMOBot(BaseBot):
    """PMO/EPMO-BOT
    Mission: coordinate portfolio and program delivery.
    Inputs: program boards, OKRs.
    Outputs: roadmaps, RAID logs, status packs.
    KPIs: on-time delivery, risk burn-down.
    Guardrails: project governance, change control.
    Hand-offs: PMO, exec sponsors.
    """

    name = "PMO/EPMO-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
