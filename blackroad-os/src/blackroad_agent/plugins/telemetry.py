"""Synthetic telemetry plugin used for bootstrapping."""

from __future__ import annotations

import asyncio
import random
from typing import Any, Dict

from .base import AgentPlugin


class Plugin(AgentPlugin):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self._task: asyncio.Task | None = None
        self._running = asyncio.Event()

    async def start(self) -> None:
        self._running.set()
        loop = self.context.loop
        self._task = loop.create_task(self._emit_metrics())

    async def stop(self) -> None:
        self._running.clear()
        if self._task:
            await self._task

    async def execute(self, action_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._sample()

    async def _emit_metrics(self) -> None:
        interval = float(self.options.get("interval_seconds", 15))
        while self._running.is_set():
            sample = self._sample()
            # TODO: ship to transports once implemented
            await asyncio.sleep(interval)
            _ = sample

    def _sample(self) -> Dict[str, Any]:
        return {
            "cpu_percent": round(random.uniform(5, 40), 2),
            "memory_percent": round(random.uniform(10, 60), 2),
            "temperature_c": round(random.uniform(35, 55), 1),
        }
