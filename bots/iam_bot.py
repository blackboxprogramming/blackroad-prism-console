from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class IAMBot(BaseBot):
    """IAM-BOT
    Mission: ensure least privilege and perform access reviews.
    Inputs: IdP, RBAC matrix, access logs.
    Outputs: access reviews, SoD checks.
    KPIs: orphaned access, review SLA.
    Guardrails: identity policies, GDPR.
    Hand-offs: IAM admins, auditors.
    """

    name = "IAM-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
