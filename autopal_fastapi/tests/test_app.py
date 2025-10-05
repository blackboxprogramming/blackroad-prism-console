import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from autopal_fastapi.app import Identity, create_app, get_identity


@pytest.fixture
def app():
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
