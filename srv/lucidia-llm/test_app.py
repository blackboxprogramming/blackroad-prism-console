import sys
from pathlib import Path

from fastapi.testclient import TestClient

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from app import app

def test_health():
    client = TestClient(app)
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'ok'
