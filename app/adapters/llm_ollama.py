

from __future__ import annotations
import requests, os
from typing import Optional
from app.state import OLLAMA

class OllamaAdapter:
    def __init__(self):
        self.host = os.getenv("OLLAMA_HOST", OLLAMA.get("host", "http://localhost:11434"))
        self.model = os.getenv("OLLAMA_MODEL", OLLAMA.get("model", "phi3:latest"))
        self.options = OLLAMA.get("options", {}) or {}

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        url = f"{self.host}/api/generate"
        full = prompt if not system else f"{system}\n\n{prompt}"
        payload = {
            "model": self.model,
            "prompt": full,
            "stream": False,
            "options": self.options
        }
        r = requests.post(url, json=payload, timeout=180)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or "").strip()

