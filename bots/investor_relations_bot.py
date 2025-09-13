from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class InvestorRelationsBot(BaseBot):
    """Investor-Relations-BOT
    Mission: craft earnings materials and manage investor communications.
    Inputs: results, guidance, comps.
    Outputs: earnings script, slides, Q&A document.
    KPIs: call sentiment, guidance variance.
    Guardrails: Reg FD, disclosure policy.
    Hand-offs: CFO, IR team.
    """

    name = "Investor-Relations-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
