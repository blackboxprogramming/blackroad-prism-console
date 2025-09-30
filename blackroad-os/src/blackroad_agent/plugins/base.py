"""Plugin primitives."""

from __future__ import annotations

import abc
from typing import Any, Dict

from ..agent import AgentContext


class AgentPlugin(abc.ABC):
    """Base class for agent plugins."""

    def __init__(self, name: str, options: Dict[str, Any], context: AgentContext):
        self.name = name
        self.options = options
        self.context = context

    async def configure(self) -> None:
        """Optional setup hook that runs before `start`."""

    @abc.abstractmethod
    async def start(self) -> None:
        """Bring the plugin online."""

    @abc.abstractmethod
    async def stop(self) -> None:
        """Shut the plugin down."""

    @abc.abstractmethod
    async def execute(self, action_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an action routed to this plugin."""
