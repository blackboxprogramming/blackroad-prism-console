"""Deploy resource helpers."""
from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict
import uuid

RequestFn = Callable[[str, Dict[str, Any]], Awaitable[Any]]


class DeploysResource:
    """Interface for deploy endpoints."""

    def __init__(self, requester: RequestFn) -> None:
        self._request = requester

    async def create(self, payload: Dict[str, Any]) -> Any:
        headers = {"Idempotency-Key": str(uuid.uuid4())}
        data = await self._request("/v1/deploys", {"method": "POST", "json": payload, "headers": headers})
        return data

    async def promote(self, release_id: str) -> Any:
        return await self._request(f"/v1/releases/{release_id}:promote", {"method": "POST"})
