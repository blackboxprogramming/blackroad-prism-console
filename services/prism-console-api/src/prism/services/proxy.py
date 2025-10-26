from __future__ import annotations

from typing import Any

import httpx

from ..config import Settings


class RunbookProxy:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _target_url(self) -> str:
        return self.settings.gateway_base_url or self.settings.roadglitch_base_url

    async def execute(self, runbook_id: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=self._target_url(), timeout=10.0) as client:
            response = await client.post("/runs", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()


__all__ = ["RunbookProxy"]
