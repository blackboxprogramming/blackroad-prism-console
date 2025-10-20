from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class FinOpsCostOptBot(BaseBot):
    """FinOps/Cost-Opt-BOT
    Mission: control cloud spend and forecast costs.
    Inputs: billing data, resource tags, usage metrics.
    Outputs: RI/SP plans, rightsizing recommendations.
    KPIs: $\/unit, waste %, forecast accuracy.
    Guardrails: spend limits, tagging policy.
    Hand-offs: finance, platform teams.
    """

    name = "FinOps/Cost-Opt-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
