from importlib.machinery import SourceFileLoader
from fastapi.testclient import TestClient

module = SourceFileLoader("llm_stub", "srv/lucidia-llm/app.py").load_module()
app = module.app
client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
