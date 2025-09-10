import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "srv"))
from aicodecloud.app import app  # type: ignore


def test_state_endpoint_handles_missing_getloadavg(monkeypatch):
    monkeypatch.delattr(os, "getloadavg", raising=False)
    with app.test_client() as client:
        response = client.get("/api/state")
    assert response.status_code == 200
    data = response.get_json()
    assert data["load1m"] == 0.0
