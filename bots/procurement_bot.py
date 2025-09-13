from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class ProcurementBot(BaseBot):
    """Procurement-BOT
    Mission: streamline sourcing, RFPs, and vendor selection.
    Inputs: spend cube, contracts, vendor list.
    Outputs: RFP packs, award memos, savings log.
    KPIs: cost-savings %, cycle time, compliance rate.
    Guardrails: vendor policy, contract clauses.
    Hand-offs: procurement lead, legal.
    """

    name = "Procurement-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
