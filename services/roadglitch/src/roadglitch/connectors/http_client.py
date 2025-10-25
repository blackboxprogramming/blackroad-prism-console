from __future__ import annotations

from typing import Any, Dict

import httpx

from ..config import get_settings


class HttpConnector:
    def __init__(self, method: str) -> None:
        self.method = method.upper()
        self.name = f"connector.http.{self.method.lower()}"

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        url = params["url"]
        timeout = params.get("timeoutMs", 5000) / 1000.0
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(self.method, url, json=params.get("json"))
        return {"status_code": response.status_code, "json": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text}


http_get = HttpConnector("GET")
http_post = HttpConnector("POST")

__all__ = ["http_get", "http_post", "HttpConnector"]

