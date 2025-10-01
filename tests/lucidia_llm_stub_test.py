from importlib.machinery import SourceFileLoader
from fastapi.testclient import TestClient

module = SourceFileLoader("llm_stub", "srv/lucidia-llm/app.py").load_module()
app = module.app
client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_chat_returns_echo_response():
    res = client.post(
        "/chat",
        json={"prompt": "ping"},
    )
    assert res.status_code == 200
    assert res.json()["text"] == "LLM stub response to: ping"


def test_chat_includes_system_prefix_when_present():
    res = client.post(
        "/chat",
        json={"prompt": "status", "system": "SYS"},
    )
    assert res.status_code == 200
    assert res.json()["text"] == "SYS LLM stub response to: status"
