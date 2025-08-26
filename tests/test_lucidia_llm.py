from importlib import util
from pathlib import Path

from fastapi.testclient import TestClient

spec = util.spec_from_file_location("lucidia_llm_app", Path("lucidia-llm/app.py"))
module = util.module_from_spec(spec)
assert spec.loader is not None  # for mypy
spec.loader.exec_module(module)  # type: ignore[attr-defined]

client = TestClient(module.app)


def test_chat_stub():
    resp = client.post("/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["choices"][0]["content"].startswith("Lucidia stub:")
