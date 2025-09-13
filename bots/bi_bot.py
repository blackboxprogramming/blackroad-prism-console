from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class BIBot(BaseBot):
    """BI-BOT
    Mission: deliver dashboards and self-serve analytics.
    Inputs: semantic layer.
    Outputs: exec dashboards, alerts.
    KPIs: dashboard adoption, alert precision.
    Guardrails: data access controls, visualization standards.
    Hand-offs: exec team, analysts.
    """

    name = "BI-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
