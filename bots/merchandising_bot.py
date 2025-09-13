from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class MerchandisingBot(BaseBot):
    """Merchandising-BOT
    Mission: plan and optimize merchandise assortments.
    Inputs: sales data, supplier terms.
    Outputs: planograms, pricing updates.
    KPIs: sell-through rate, margin.
    Guardrails: vendor agreements, compliance.
    Hand-offs: merchandising team, stores.
    """

    name = "Merchandising-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
