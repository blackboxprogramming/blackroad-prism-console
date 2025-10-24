"""Client implementation for the BlackRoad Public API."""
from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from .deploys import DeploysResource
from .captions import CaptionsResource
from .simulations import SimulationsResource

Options = Dict[str, Any]


class BlackRoadClient:
    """High-level client that exposes strongly typed resources."""

    def __init__(self, base_url: str, token: Optional[str] = None, *, client: Optional[httpx.AsyncClient] = None) -> None:
        self._base_url = base_url.rstrip('/')
        self._token = token
        self._http = client or httpx.AsyncClient(base_url=self._base_url)
        self.deploys = DeploysResource(self._request)
        self.captions = CaptionsResource(self._request)
        self.simulations = SimulationsResource(self._request)

    async def close(self) -> None:
        await self._http.aclose()

    async def _request(self, path: str, options: Optional[Options] = None) -> Any:
        options = options or {}
        method = options.get("method", "GET")
        json_payload = options.get("json")
        headers = options.get("headers", {})
        if self._token:
            headers = {"Authorization": f"Bearer {self._token}", **headers}
        response = await self._http.request(method, path, json=json_payload, headers=headers)
        response.raise_for_status()
        return response.json()


__all__ = ["BlackRoadClient"]
