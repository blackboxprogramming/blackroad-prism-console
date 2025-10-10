import pytest
import json
from pathlib import Path

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from autopal_fastapi.app import Identity, create_app, get_identity


@pytest.fixture
def audit_log_path(tmp_path, monkeypatch) -> Path:
    path = tmp_path / "audit-log.jsonl"
    monkeypatch.setenv("AUTOPAL_AUDIT_LOG_PATH", str(path))
    yield path
    monkeypatch.delenv("AUTOPAL_AUDIT_LOG_PATH", raising=False)


@pytest.fixture
def app(audit_log_path: Path):
    test_app = create_app()

    def identity_override(request: Request) -> Identity:
        actor = request.headers.get("x-actor", "tester")
        return Identity(subject=actor, email=f"{actor}@example.com")

    test_app.dependency_overrides[get_identity] = identity_override
    return test_app


@pytest.fixture
def client(app):
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_health_routes_operate_during_maintenance(client):
    response = client.post("/maintenance/activate")
    assert response.status_code == 200
    assert response.json()["maintenance_mode"] is True

    health = client.get("/health/live")
    assert health.status_code == 200
    assert health.json()["status"] == "live"

    client.post("/maintenance/deactivate")


def test_maintenance_blocks_non_allowlisted_routes(client):
    client.post("/maintenance/activate")
    response = client.get("/secrets/materialize", headers={"x-step-up": "verified"})
    assert response.status_code == 503
    assert response.json()["detail"] == "maintenance_mode"

    client.post("/maintenance/deactivate")
    success = client.get("/secrets/materialize", headers={"x-step-up": "verified"})
    assert success.status_code == 200
    assert success.json()["materialized"] == "secret"


def test_step_up_required_until_header_present(client):
    missing = client.get("/secrets/materialize")
    assert missing.status_code == 401
    assert missing.json()["detail"] == "step_up_required"

    granted = client.get("/secrets/materialize", headers={"x-step-up": "verified"})
    assert granted.status_code == 200
    assert granted.json()["granted_to"] == "tester"


def test_dual_control_flow_requires_distinct_approvals(client):
    created = client.post("/controls/overrides", json={"reason": "rotate secrets"})
    assert created.status_code == 201
    override_id = created.json()["override_id"]

    first = client.post(f"/controls/overrides/{override_id}/approve", headers={"x-actor": "alice"})
    assert first.status_code == 200
    assert first.json()["granted"] is False
    assert first.json()["approvals"] == ["alice"]

    duplicate = client.post(f"/controls/overrides/{override_id}/approve", headers={"x-actor": "alice"})
    assert duplicate.status_code == 400

    second = client.post(f"/controls/overrides/{override_id}/approve", headers={"x-actor": "bob"})
    assert second.status_code == 200
    assert second.json()["granted"] is True
    assert set(second.json()["approvals"]) == {"alice", "bob"}


def test_rate_limit_can_be_tightened_and_triggers_429(client):
    configure = client.post("/config/rate-limit", json={"limit": 2, "window_seconds": 60})
    assert configure.status_code == 200

    first = client.get("/limited/ping", headers={"x-actor": "ratelimited"})
    assert first.status_code == 200

    second = client.get("/limited/ping", headers={"x-actor": "ratelimited"})
    assert second.status_code == 200

    third = client.get("/limited/ping", headers={"x-actor": "ratelimited"})
    assert third.status_code == 429
    assert third.json()["detail"] == "rate_limit_exceeded"


def test_audit_log_captures_trace_context(client, audit_log_path: Path):
    response = client.get("/health/live")
    trace_id = response.headers.get("x-trace-id")
    assert trace_id, "trace header should be attached to responses"

    assert audit_log_path.exists()
    entries = [json.loads(line) for line in audit_log_path.read_text().splitlines() if line.strip()]
    assert entries, "audit log should contain at least one entry"

    matching = [event for event in entries if event.get("event") == "http.request" and event.get("path") == "/health/live"]
    assert matching, "expected a request audit entry for /health/live"
    assert matching[-1].get("trace_id") == trace_id
