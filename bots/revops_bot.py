from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class RevOpsBot(BaseBot):
    """RevOps-BOT
    Mission: improve funnel hygiene and forecasting accuracy.
    Inputs: CRM, product usage data.
    Outputs: forecasts, pipeline QA, dashboards.
    KPIs: conversion rate, forecast error.
    Guardrails: customer data privacy, role permissions.
    Hand-offs: CRO, sales ops.
    """

    name = "RevOps-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
