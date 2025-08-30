"""Ollama MCP server for Lucidia.

This server exposes simple tools to interact with a locally running
`ollama` instance. Only models present in the allow-list are accepted.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

try:
    import requests
except Exception:  # pragma: no cover - requests may be optional
    requests = None  # type: ignore

session = requests.Session() if requests else None

try:
    from mcp.server import Server as MCPServer
except Exception:  # pragma: no cover
    MCPServer = None

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL_ALLOWLIST = set(
    os.environ.get("LUCIDIA_OLLAMA_MODELS", "phi3:latest,mistral:instruct").split(",")
)
TIMEOUT = float(os.environ.get("LUCIDIA_OLLAMA_TIMEOUT", "30"))

server = MCPServer("lucidia-ollama") if MCPServer else None


def _check_model(model: str) -> None:
    if model not in MODEL_ALLOWLIST:
        raise ValueError("model not allowed")


def _post(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if session is None:
        raise RuntimeError("requests not installed")
    url = f"{OLLAMA_URL}/{endpoint}"
    response = session.post(url, json=payload, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


if server:

    @server.tool()
    def generate(model: str, prompt: str) -> str:
        """Generate text from ``prompt`` using ``model``."""
        _check_model(model)
        data = _post("api/generate", {"model": model, "prompt": prompt})
        return data.get("response", "")

    @server.tool()
    def chat(model: str, messages: List[Dict[str, str]]) -> str:
        """Chat with ``model`` using a list of messages."""
        _check_model(model)
        data = _post("api/chat", {"model": model, "messages": messages})
        return data.get("response", "")

    @server.tool()
    def embed(model: str, text: str) -> List[float]:
        """Return an embedding vector for ``text`` using ``model``."""
        _check_model(model)
        data = _post("api/embed", {"model": model, "input": text})
        return data.get("embedding", [])


def complete_code(model: str, prompt: str, language: str = "python") -> str:
    """Return a code completion for ``prompt`` in ``language`` using ``model``."""
    _check_model(model)
    full_prompt = f"# language: {language}\n{prompt}"
    data = _post(
        "api/generate",
        {
            "model": model,
            "prompt": full_prompt,
            "options": {"num_predict": 256, "temperature": 0.0},
        },
    )
    return data.get("response", "")


if server:
    complete_code = server.tool()(complete_code)


def main() -> None:
    if not server:
        raise RuntimeError("mcp package not installed")
    server.run()


if __name__ == "__main__":  # pragma: no cover - manual invocation
    main()
