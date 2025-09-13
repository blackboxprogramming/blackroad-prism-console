from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class CXInsightsBot(BaseBot):
    """CX-Insights-BOT
    Mission: synthesize customer feedback to reduce churn.
    Inputs: tickets, surveys, product usage.
    Outputs: driver analysis, churn risk alerts, action plans.
    KPIs: NPS, churn %, time-to-value.
    Guardrails: customer privacy, data retention.
    Hand-offs: customer success, product teams.
    """

    name = "CX-Insights-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
