from __future__ import annotations
import httpx, json
from typing import List, Dict

class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    async def chat(self, system: str, messages: List[Dict], temperature: float, max_tokens: int) -> str:
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}] + messages,
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(f"{self.base_url}/api/chat", json=payload)
            r.raise_for_status()
            data = r.json()
        # Ollama returns {"message": {"content": "..."}}
        if "message" in data and "content" in data["message"]:
            return data["message"]["content"]
        # Some versions return "choices"
        if "choices" in data and data["choices"]:
            return data["choices"][0]["message"]["content"]
        return ""
