from __future__ import annotations

import json
import time
from copy import deepcopy
from typing import Any, Dict, Tuple
from uuid import uuid4

from cryptography.hazmat.primitives.asymmetric import rsa
import jwt
import pytest
from fastapi.testclient import TestClient

from app.approvals import reset_store
from app.config import ConfigHolder
from app.main import create_app
from app.oidc import _jwks_cache
from app.ratelimit import reset_buckets


@pytest.fixture(scope="session")
def rsa_material() -> Tuple[Any, Dict[str, Any]]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(private_key.public_key()))
    public_jwk["kid"] = "test-key"
    return private_key, {"keys": [public_jwk]}


@pytest.fixture(autouse=True)
def reset_runtime_state():
    reset_buckets()
    reset_store()
    _jwks_cache.clear()
    yield
    reset_buckets()
    reset_store()
    _jwks_cache.clear()


@pytest.fixture
def client_builder(tmp_path, rsa_material):
    private_key, jwks = rsa_material

    def build(overrides: Dict[str, Any] | None = None) -> Tuple[TestClient, ConfigHolder, Any, Dict[str, Any]]:
        base = {
            "auth": {
                "oidc": {
                    "issuer": "https://issuer.example.com/",
                    "jwks_url": "https://issuer.example.com/.well-known/jwks.json",
                    "clock_skew_seconds": 300,
                    "audience_allowlist": [
                        "gha:org/repo@refs/heads/main",
                        "gha:org/repo@refs/tags/v*",
                    ],
                }
            },
            "rate_limits": {
                "global_per_minute": 600,
                "per_caller_per_minute": 60,
                "endpoints": {
                    "POST /secrets/materialize": {"per_minute": 10, "burst": 3},
                    "POST /fossil/override": {"per_minute": 6, "burst": 2},
                },
            },
            "dual_control": {
                "provider": "webhook",
                "callback_url": "https://approvals.example.com/callback",
                "ttl_seconds": 900,
                "require_distinct_approvers": True,
            },
        }
        if overrides:
            base = _merge_dicts(base, overrides)
        cfg_path = tmp_path / f"autopal_{uuid4().hex}.config.json"
        cfg_path.write_text(json.dumps(base))
        cfg = ConfigHolder(cfg_path)
        _jwks_cache["jwks"] = deepcopy(jwks)
        client = TestClient(create_app(cfg))
        return client, cfg, private_key, base

    return build


def _merge_dicts(base: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    result = deepcopy(base)
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _merge_dicts(result[key], value)
        else:
            result[key] = value
    return result


def _make_token(private_key, config: Dict[str, Any], *, sub: str = "actor", aud: str = "gha:org/repo@refs/heads/main") -> str:
    now = int(time.time())
    payload = {
        "iss": config["auth"]["oidc"]["issuer"],
        "sub": sub,
        "aud": aud,
        "iat": now,
        "exp": now + 600,
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": "test-key"})


def _headers(token: str, audience: str = "gha:org/repo@refs/heads/main") -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}", "X-Audience": audience}


def test_materialize_requires_oidc(client_builder):
    client, _, private_key, config = client_builder()
    response = client.post("/secrets/materialize")
    assert response.status_code == 401
    token = _make_token(private_key, config)
    bad_headers = _headers(token, audience="gha:org/repo@refs/heads/feature")
    response = client.post("/secrets/materialize", headers=bad_headers)
    assert response.status_code == 401
    assert response.json()["detail"]["message"] == "audience_not_allowed"


def test_materialize_rate_limit(client_builder):
    client, _, private_key, config = client_builder()
    headers = _headers(_make_token(private_key, config))
    for _ in range(3):
        resp = client.post("/secrets/materialize", headers=headers)
        assert resp.status_code == 200
    resp = client.post("/secrets/materialize", headers=headers)
    assert resp.status_code == 429
    assert resp.headers["retry-after"]


def test_dual_control_flow(client_builder):
    client, _, private_key, config = client_builder()
    actor_headers = _headers(_make_token(private_key, config, sub="actor-1"))
    override_resp = client.post(
        "/fossil/override",
        headers=actor_headers,
        json={"policy": "ship", "scope": "prod"},
    )
    assert override_resp.status_code == 200
    body = override_resp.json()
    assert body["granted"] == "pending_second_approval"
    rid = body["request_id"]

    approver_one_headers = _headers(_make_token(private_key, config, sub="approver-1"))
    first = client.post(f"/approvals/{rid}/approve", headers=approver_one_headers)
    assert first.status_code == 200
    assert first.json()["granted"] is False

    approver_two_headers = _headers(_make_token(private_key, config, sub="approver-2"))
    second = client.post(f"/approvals/{rid}/approve", headers=approver_two_headers)
    assert second.status_code == 200
    assert second.json()["granted"] is True

    third = client.post(f"/approvals/{rid}/approve", headers=approver_two_headers)
    assert third.status_code == 400
    assert third.json()["detail"]["code"] == "must_be_distinct"


def test_dual_control_expiration(client_builder, monkeypatch):
    overrides = {"dual_control": {"ttl_seconds": 1}}
    client, _, private_key, config = client_builder(overrides)
    actor_headers = _headers(_make_token(private_key, config, sub="actor-1"))
    override_resp = client.post(
        "/fossil/override",
        headers=actor_headers,
        json={"policy": "ship", "scope": "prod"},
    )
    rid = override_resp.json()["request_id"]

    original_time = time.time

    def fake_time() -> float:
        return original_time() + 5

    monkeypatch.setattr("app.approvals.time.time", fake_time)
    headers = _headers(_make_token(private_key, config, sub="approver"))
    resp = client.post(f"/approvals/{rid}/approve", headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "expired"
