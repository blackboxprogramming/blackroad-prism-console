"""HTTP transport stub for the agent."""

from __future__ import annotations

import asyncio
from typing import Any, Dict

from .base import Transport


class TransportImpl(Transport):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self._running = False

    async def start(self) -> None:
        self._running = True
        await asyncio.sleep(0)

    async def stop(self) -> None:
        self._running = False
        await asyncio.sleep(0)

    async def invoke(self, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self._running:
            raise RuntimeError("HTTP transport is not running")
        return await self.handle_action(action_id=action, payload=payload)
