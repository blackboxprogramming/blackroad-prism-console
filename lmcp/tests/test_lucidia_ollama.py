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
