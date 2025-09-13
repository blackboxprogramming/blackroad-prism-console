from orchestrator.base import BaseBot
from orchestrator.protocols import BotResponse, Task


class TreasuryBot(BaseBot):
    """
    MISSION: Provide treasury analysis for cash forecasting and hedging.
    INPUTS: Task context containing financial parameters.
    OUTPUTS: Cash forecast or hedging plan summaries.
    KPIS: Cash position accuracy, hedge coverage.
    GUARDRAILS: Uses deterministic mock data only; no external systems.
    HANDOFFS: Finance team for execution.
    """

    name = "Treasury-BOT"
    mission = "Assist with cash forecasting and hedging outlines."

    def run(self, task: Task) -> BotResponse:
        goal = task.goal.lower()
        if "13-week" in goal:
            summary = "Generated mock 13-week cash forecast including KPIs."
            data = {
                "weekly_cash": [10000 + i * 100 for i in range(13)],
                "currency": "USD",
                "kpis": {"accuracy": 0.9},
            }
            artifacts = [f"/artifacts/{task.id}/cash_forecast.csv"]
            next_actions = ["Review forecast", "Adjust assumptions"]
        elif "hedging" in goal:
            summary = "Outlined mock hedging plan with KPI coverage ratios."
            data = {
                "hedges": [
                    {"instrument": "forward", "amount": 50000, "rate": 1.1}
                ],
                "kpis": {"coverage": 0.8},
            }
            artifacts = [f"/artifacts/{task.id}/hedging_plan.md"]
            next_actions = ["Confirm exposures", "Execute hedges"]
        else:
            summary = "Unable to process request."
            data = {}
            artifacts = []
            next_actions = []

        steps = ["gather data", "analyze", "summarize"]
        risks = ["Mock data may not reflect reality"]
        return BotResponse(
            task_id=task.id,
            summary=summary,
            steps=steps,
            data=data,
            risks=risks,
            artifacts=artifacts,
            next_actions=next_actions,
            ok=bool(data),
        )
