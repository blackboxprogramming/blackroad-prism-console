from orchestrator.protocols import BotResponse, Task

from .base import BaseBot


class DesignUXBot(BaseBot):
    """Design/UX-BOT
    Mission: translate research into UX specifications.
    Inputs: user interviews, telemetry.
    Outputs: JTBD, user flows, acceptance criteria.
    KPIs: task success rate, SUS score.
    Guardrails: accessibility standards, design system.
    Hand-offs: product managers, engineers.
    """

    name = "Design/UX-BOT"

    def run(self, task: Task) -> BotResponse:
        return super().run(task)
