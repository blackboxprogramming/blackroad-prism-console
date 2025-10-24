"""Simulation resource helpers."""
from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict

RequestFn = Callable[[str, Dict[str, Any]], Awaitable[Any]]


class SimulationsResource:
    """Interface for simulation endpoints."""

    def __init__(self, requester: RequestFn) -> None:
        self._request = requester

    async def create(self, payload: Dict[str, Any]) -> Any:
        return await self._request("/v1/simulations", {"method": "POST", "json": payload})

    async def get(self, simulation_id: str) -> Any:
        return await self._request(f"/v1/simulations/{simulation_id}")

    async def list_artifacts(self, simulation_id: str) -> Any:
        return await self._request(f"/v1/simulations/{simulation_id}/artifacts")
