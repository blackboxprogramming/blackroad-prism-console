"""Transport abstractions."""

from __future__ import annotations

import abc
from typing import Any

from ..agent import Agent
from ..config import TransportConfig


class Transport(abc.ABC):
    def __init__(self, config: TransportConfig, agent: Agent):
        self.config = config
        self.agent = agent

    @abc.abstractmethod
    async def start(self) -> None:
        """Bring the transport online."""

    @abc.abstractmethod
    async def stop(self) -> None:
        """Stop the transport."""

    async def handle_action(self, action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return await self.agent.dispatch(action_id=action_id, payload=payload)
