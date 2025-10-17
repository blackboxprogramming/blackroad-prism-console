"""Model runtime plugin leveraging backend adapters."""

from __future__ import annotations

from typing import Any, Dict

from .base import AgentPlugin
from ..runtime import registry


class Plugin(AgentPlugin):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        backend_name = self.options.get("backend", "local-cpu")
        self._backend = registry.get_backend(backend_name)

    async def start(self) -> None:  # pragma: no cover - trivial
        await self._backend.start()

    async def stop(self) -> None:  # pragma: no cover - trivial
        await self._backend.stop()

    async def execute(self, action_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        prompt = payload["prompt"]
        parameters = payload.get("parameters", {})
        return await self._backend.run(prompt=prompt, parameters=parameters)
