import importlib
import math
import os

from fastapi.testclient import TestClient

from services.quantum_lab import puzzles


def test_chsh_quantum_win_rate():
    res = puzzles.simulate_chsh(shots=50_000, noise_p=0.0, seed=123)
    assert abs(res["win_rate"] - math.cos(math.pi / 8) ** 2) < 0.01
    assert abs(res["S_estimate"] - 2 * math.sqrt(2)) < 0.02
    res_noisy = puzzles.simulate_chsh(shots=50_000, noise_p=0.02, seed=123)
    assert res_noisy["win_rate"] < res["win_rate"]
    assert res_noisy["S_estimate"] < res["S_estimate"]


def test_requires_token(monkeypatch):
    monkeypatch.setenv("QUANTUM_API_TOKEN", "secret")
    app_module = importlib.reload(importlib.import_module("services.quantum_lab.app"))
    client = TestClient(app_module.app)
    client.post("/api/quantum/login")
    r = client.get("/api/quantum/chsh/simulate?shots=10&noise_p=0&seed=1")
    assert r.status_code == 403
