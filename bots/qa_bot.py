from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class QABot(BaseBot):
    """QA-BOT
    Mission: define and automate test strategy.
    Inputs: PRDs, codebases, test environments.
    Outputs: test plans, coverage reports, defect logs.
    KPIs: escape rate, flake rate.
    Guardrails: environment isolation, data masking.
    Hand-offs: QA leads, dev teams.
    """

    name = "QA-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
