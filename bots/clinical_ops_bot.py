from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class ClinicalOpsBot(BaseBot):
    """Clinical-Ops-BOT
    Mission: coordinate clinical trial operations.
    Inputs: trial protocols, site data.
    Outputs: study plans, monitoring reports.
    KPIs: enrollment rate, protocol deviations.
    Guardrails: GCP compliance, patient safety.
    Hand-offs: clinical operations, CROs.
    """

    name = "Clinical-Ops-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
