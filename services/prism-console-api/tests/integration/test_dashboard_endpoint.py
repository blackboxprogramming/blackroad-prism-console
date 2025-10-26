from __future__ import annotations

from fastapi.testclient import TestClient


def test_dashboard_requires_auth(client: TestClient) -> None:
    response = client.get("/api/mobile/dashboard")
    assert response.status_code == 401


def test_dashboard_returns_metrics(client: TestClient) -> None:
    response = client.get(
        "/api/mobile/dashboard",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "metrics" in body and body["metrics"]
    assert body["shortcuts"][0]["id"] == "runbooks"
