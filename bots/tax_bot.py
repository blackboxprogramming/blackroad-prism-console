from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class TaxBot(BaseBot):
    """Tax-BOT
    Mission: manage direct/indirect tax obligations and filings.
    Inputs: GL, entity map, jurisdictions.
    Outputs: returns calendar, tax provision, risk flags.
    KPIs: on-time filings, effective tax rate.
    Guardrails: jurisdictional tax law, data privacy.
    Hand-offs: tax director, auditors.
    """

    name = "Tax-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
