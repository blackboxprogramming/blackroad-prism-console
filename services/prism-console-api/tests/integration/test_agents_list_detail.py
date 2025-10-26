from __future__ import annotations

from fastapi.testclient import TestClient


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer token"}


def test_list_agents(client: TestClient) -> None:
    response = client.get("/api/agents", headers=_auth_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["items"][0]["id"].startswith("agent-")


def test_agent_detail(client: TestClient) -> None:
    list_response = client.get("/api/agents", headers=_auth_headers()).json()
    agent_id = list_response["items"][0]["id"]
    response = client.get(f"/api/agents/{agent_id}", headers=_auth_headers())
    assert response.status_code == 200
    detail = response.json()
    assert detail["agent"]["id"] == agent_id
    assert detail["recent"]
