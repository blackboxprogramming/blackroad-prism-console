"""Optional helper for talking to a local Ollama instance."""
from __future__ import annotations

import os
from typing import Any

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")


def generate(prompt: str, model: str = "llama3") -> Any:
    """Call a locally running Ollama server.

    This function is disabled by default and only contacts localhost.
    """
    resp = httpx.post(f"{OLLAMA_URL}/api/generate", json={"model": model, "prompt": prompt})
    return resp.json()
