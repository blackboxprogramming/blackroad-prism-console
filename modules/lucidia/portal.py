"""Core chat portal orchestrating multiple agents."""

from __future__ import annotations

from typing import Dict, List, Protocol


class Agent(Protocol):
    """Simple protocol that all chat agents must follow."""

    def respond(self, message: str) -> str:  # pragma: no cover - protocol definition
        """Return a response for the given message."""


class LucidiaPortal:
    """Coordinate a conversation across multiple agents."""

    def __init__(self, agents: List[Agent] | None = None) -> None:
        self.agents: List[Agent] = agents or []

    def register(self, agent: Agent) -> None:
        """Register a new agent with the portal."""
        self.agents.append(agent)

    def chat(self, message: str) -> Dict[str, str]:
        """Send ``message`` to all agents and collect their responses."""
        responses: Dict[str, str] = {}
        for agent in self.agents:
            name = getattr(agent, "name", agent.__class__.__name__)
            try:
                responses[name] = agent.respond(message)
            except Exception as exc:  # noqa: BLE001 - generic for user feedback
                responses[name] = f"Error: {exc}"
        return responses
