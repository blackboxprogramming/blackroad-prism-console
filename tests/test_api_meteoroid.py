import socket
import sys
import socket
import sys
from pathlib import Path

import pytest

pytest.importorskip("fastapi", reason="Install fastapi or ask codex for help")
pytest.importorskip("numpy", reason="Install numpy or ask codex for help")
from fastapi.testclient import TestClient

# Ensure the app and modules can be imported
ROOT = Path(__file__).resolve().parents[1] / "opt" / "blackroad"
sys.path.insert(0, str(ROOT))
from main import app  # type: ignore  # noqa:E402


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Fail tests if any code tries to access the network."""
    def fail(*args, **kwargs):  # pragma: no cover - simple guard
        raise RuntimeError("Network access disabled during tests")

    monkeypatch.setattr(socket.socket, "connect", fail, raising=True)


client = TestClient(app)


def test_solve_ok():
    payload = {
        "a": 1.0,
        "e": 0.0167,
        "i": 0.0,
        "x": 1.0,
        "y": 0.0,
        "z": 0.0,
        "units": "astro",
    }
    res = client.post("/api/astro/meteoroid/solve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["branch_count"] == len(data["velocities_SI"]) == len(data["velocities_astro"]) > 0
    assert "density_SI" in data and "density_astro" in data


def test_out_of_bounds():
    payload = {
        "a": 1.0,
        "e": 0.0,
        "i": 0.0,
        "x": 150.0,  # beyond safe bounds
        "y": 0.0,
        "z": 0.0,
        "units": "astro",
    }
    res = client.post("/api/astro/meteoroid/solve", json=payload)
    assert res.status_code == 400
