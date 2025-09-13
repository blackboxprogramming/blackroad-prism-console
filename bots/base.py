from abc import ABC

from orchestrator.protocols import BotResponse, Task


class BaseBot(ABC):
    name: str = "BaseBot"

    def run(self, task: Task) -> BotResponse:
        """Default run implementation returning a stub response."""
        return BotResponse(
            summary=f"{self.name} processed task {task.id}",
            steps=["analyze task", "produce stub response"],
            data_assumptions=["no real data used"],
            risks_gaps=["not a real implementation"],
            artifacts={},
            next_actions=["review output"],
        )
