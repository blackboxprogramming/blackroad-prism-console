from __future__ import annotations
import httpx
from typing import List, Dict

class LucidiaClient:
    """
    Expected Lucidia Codex endpoint contract (adjust to your server):
    POST {base_url}{route}
    {
      "system": str,
      "messages": [{"role":"user"|"assistant","content": str}, ...],
      "temperature": float,
      "max_tokens": int,
      "mode": "CHITCHAT"|"BUILD",
      "sigils": {"project":"BlackRoad","agent":"Codex Liaison"}
    }
    -> {"content": str}
    """
    def __init__(self, base_url: str, route: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.route = route
        self.timeout = timeout

    async def chat(self, system: str, messages: List[Dict], temperature: float, max_tokens: int, mode: str) -> str:
        payload = {
            "system": system,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "mode": mode,
            "sigils": {"project": "BlackRoad", "agent": "Codex Liaison"}
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(f"{self.base_url}{self.route}", json=payload)
            r.raise_for_status()
            data = r.json()
        return data.get("content", "")
