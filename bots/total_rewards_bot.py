from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class TotalRewardsBot(BaseBot):
    """Total-Rewards-BOT
    Mission: administer compensation bands, equity, and benefits.
    Inputs: benchmarks, budget.
    Outputs: comp cycles, offer packages, employee education.
    KPIs: compa-ratio health, offer acceptance rate.
    Guardrails: pay equity laws, HRIS security.
    Hand-offs: HR/comp team, managers.
    """

    name = "Total-Rewards-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
