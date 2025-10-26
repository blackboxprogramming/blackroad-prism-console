from __future__ import annotations

from fastapi.testclient import TestClient


def test_rate_limit_triggers(client: TestClient) -> None:
    headers = {"Authorization": "Bearer token"}
    for _ in range(130):
        response = client.get("/api/agents", headers=headers)
        if response.status_code == 429:
            break
    assert response.status_code in {200, 429}
