from __future__ import annotations

from fastapi.testclient import TestClient


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer token"}


def test_runbook_list(client: TestClient) -> None:
    response = client.get("/api/runbooks", headers=_auth_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["items"]


def test_runbook_execute_mock(client: TestClient) -> None:
    runbook_id = client.get("/api/runbooks", headers=_auth_headers()).json()["items"][0]["id"]
    response = client.post(
        f"/api/runbooks/{runbook_id}/execute",
        headers=_auth_headers(),
        json={"input": {"service": "gateway"}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] is True
    assert body["runId"].startswith("mock-")
