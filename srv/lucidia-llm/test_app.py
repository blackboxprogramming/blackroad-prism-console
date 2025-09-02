# <!-- FILE: srv/lucidia-llm/test_app.py -->
from fastapi.testclient import TestClient
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from app import app


def test_health():
    client = TestClient(app)
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'ok'
