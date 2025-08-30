import importlib
import pathlib
import sys

import pytest

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1] / "servers" / "lucidia_ollama"))
from lucidia_ollama import server as ollama_server


def test_model_allowlist(monkeypatch):
    monkeypatch.setenv("LUCIDIA_OLLAMA_MODELS", "a,b")
    importlib.reload(ollama_server)
    with pytest.raises(ValueError):
        ollama_server._check_model("c")


def test_complete_code(monkeypatch):
    monkeypatch.setenv("LUCIDIA_OLLAMA_MODELS", "x")
    importlib.reload(ollama_server)

    called = {}

    def fake_post(endpoint, payload):
        called["endpoint"] = endpoint
        called["payload"] = payload
        return {"response": "code"}

    monkeypatch.setattr(ollama_server, "_post", fake_post)
    result = ollama_server.complete_code("x", "def add(a, b):")
    assert called["endpoint"] == "api/generate"
    assert "def add(a, b):" in called["payload"]["prompt"]
    assert result == "code"
