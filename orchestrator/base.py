from abc import ABC, abstractmethod
from .protocols import Task, BotResponse


class BaseBot(ABC):
    """Abstract base class for bots."""

    name: str
    mission: str

    @abstractmethod
    def run(self, task: Task) -> BotResponse:  # pragma: no cover - interface
        """Run the bot on a task."""
        raise NotImplementedError


def assert_guardrails(response: BotResponse) -> None:
    """Ensure required fields in a BotResponse."""
    if not response.summary or not response.summary.strip():
        raise AssertionError("Summary required")
    if not response.steps:
        raise AssertionError("Steps required")
    if not isinstance(response.data, dict):
        raise AssertionError("Data must be a dict")
    if not response.risks:
        raise AssertionError("Risks required")
    if not response.artifacts:
        raise AssertionError("Artifacts required")
    if not response.next_actions:
        raise AssertionError("Next actions required")
    if response.ok is None:
        raise AssertionError("ok flag required")
