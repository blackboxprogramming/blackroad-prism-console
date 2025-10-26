from __future__ import annotations

import asyncio
import hashlib
from typing import Any

import httpx

from ..config import Settings
from ..observability.metrics import AUTH_CACHE_HITS


class AuthVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client = httpx.AsyncClient(base_url=settings.auth_base_url, timeout=5.0)
        self._cache: dict[str, tuple[dict[str, Any], float]] = {}
        self._lock = asyncio.Lock()

    async def close(self) -> None:
        await self._client.aclose()

    async def verify(self, token: str) -> dict[str, Any]:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        ttl_seconds = self.settings.auth_cache_ttl_ms / 1000
        loop = asyncio.get_running_loop()
        async with self._lock:
            cached = self._cache.get(token_hash)
            if cached and cached[1] > loop.time():
                AUTH_CACHE_HITS.inc()
                return cached[0]

        if self.settings.mock_mode:
            payload = {"sub": "mock-user", "scope": ["ops"], "exp": 0}
        else:
            response = await self._client.post("/tokens/verify", json={"token": token})
            response.raise_for_status()
            payload = response.json()

        async with self._lock:
            self._cache[token_hash] = (
                payload,
                loop.time() + ttl_seconds,
            )
        return payload


__all__ = ["AuthVerifier"]
