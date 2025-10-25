from __future__ import annotations

import time
from uuid import uuid4

import jwt
import pytest
from fastapi.testclient import TestClient

from app import create_app

SECRET = "test-secret"
ISSUER = "http://test-issuer"
AUDIENCE = "test-audience"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("AI_CONSOLE_JWT_SECRET", SECRET)
    monkeypatch.setenv("AI_CONSOLE_JWT_ISSUER", ISSUER)
    monkeypatch.setenv("AI_CONSOLE_JWT_AUDIENCE", AUDIENCE)
    monkeypatch.setenv("AI_CONSOLE_REDIS_URL", "memory://")
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def make_token(role: str, *, minutes: int = 5, refresh_minutes: int = 60, token_use: str = "access") -> str:
    now = int(time.time())
    refresh_exp = now + refresh_minutes * 60
    payload = {
        "sub": f"user-{role}",
        "role": role,
        "iat": now,
        "exp": now + minutes * 60,
        "refresh_exp": refresh_exp,
        "jti": uuid4().hex,
        "iss": ISSUER,
        "aud": AUDIENCE,
        "token_use": token_use,
    }
    if token_use == "refresh":
        payload["exp"] = refresh_exp
    return jwt.encode(payload, SECRET, algorithm="HS256")


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health_public(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_metrics_requires_auth(client: TestClient) -> None:
    res = client.get("/metrics")
    assert res.status_code == 401


def test_guest_reads_metrics(client: TestClient) -> None:
    token = make_token("guest")
    res = client.get("/metrics", headers=auth_header(token))
    assert res.status_code == 200
    assert "ai_console" in res.text or "http_request" in res.text


def test_guest_cannot_modify_config(client: TestClient) -> None:
    token = make_token("guest")
    res = client.put(
        "/config/rate-limit",
        json={"limit": 10, "window_seconds": 30},
        headers=auth_header(token),
    )
    assert res.status_code == 403


def test_member_updates_rate_limit(client: TestClient) -> None:
    token = make_token("member")
    res = client.put(
        "/config/rate-limit",
        json={"limit": 200, "window_seconds": 120},
        headers=auth_header(token),
    )
    assert res.status_code == 200
    body = res.json()
    assert body["config"]["limit"] == 200


def test_admin_toggles_maintenance(client: TestClient) -> None:
    token = make_token("admin")
    res = client.post("/maintenance/activate", json={}, headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["active"] is True
    res = client.get("/maintenance/status", headers=auth_header(make_token("member")))
    assert res.status_code == 200
    assert res.json()["active"] is True


def test_refresh_flow(client: TestClient) -> None:
    refresh_token = make_token("member", token_use="refresh")
    res = client.post("/auth/refresh", json={"refreshToken": refresh_token})
    assert res.status_code == 200
    payload = res.json()
    assert "accessToken" in payload
    assert "refreshToken" in payload
    decoded = jwt.decode(payload["accessToken"], SECRET, algorithms=["HS256"], audience=AUDIENCE, issuer=ISSUER)
    assert decoded["role"] == "member"


def test_session_store_records_tokens(client: TestClient) -> None:
    token = make_token("guest")
    client.get("/metrics", headers=auth_header(token))
    store = client.app.state.session_store  # type: ignore[attr-defined]
    snapshot = store.snapshot()
    assert snapshot, "expected token session to be recorded"
