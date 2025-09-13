from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class ALMBot(BaseBot):
    """ALM-BOT
    Mission: manage asset-liability balance and liquidity risk.
    Inputs: balance sheet data, interest rates.
    Outputs: gap reports, funding plans.
    KPIs: net interest margin, liquidity coverage.
    Guardrails: banking regulations, risk appetite.
    Hand-offs: treasury, risk committee.
    """

    name = "ALM-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
