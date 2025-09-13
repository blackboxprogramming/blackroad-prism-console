from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class GrantsBot(BaseBot):
    """Grants-BOT
    Mission: manage grant applications and reporting.
    Inputs: grant calls, budgets.
    Outputs: proposals, compliance reports.
    KPIs: award rate, reporting timeliness.
    Guardrails: grant rules, audit trails.
    Hand-offs: research admin, agencies.
    """

    name = "Grants-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
