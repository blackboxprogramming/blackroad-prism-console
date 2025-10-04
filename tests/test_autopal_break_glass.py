"""Tests for the Autopal break-glass and maintenance guard."""

from __future__ import annotations

import importlib
import json
import sys
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient

DEFAULT_CONFIG: dict[str, Any] = {
    "feature_flags": {"global_enabled": True, "require_step_up": True},
    "break_glass": {
        "enabled": True,
        "alg": "HS256",
        "hmac_secret_env": "AUTOPAL_BREAK_GLASS_SECRET",
        "ttl_seconds": 600,
        "allowlist_endpoints": [
            "POST /secrets/materialize",
            "POST /fossil/override",
            "POST /approvals/{rid}/approve",
        ],
        "allowed_subjects": ["ops-oncall", "sre-lead"],
    },
    "audit": {"enabled": True, "sink": "stdout", "redact_values": True},
}


@pytest.fixture
def autopal_app(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Callable[[dict[str, Any] | None], tuple[TestClient, Path]]:
    """Factory returning a configured Autopal TestClient."""

    def factory(overrides: dict[str, Any] | None = None) -> tuple[TestClient, Path]:
        config = json.loads(json.dumps(DEFAULT_CONFIG))
        if overrides:
            merge_dict(config, overrides)

        config_path = tmp_path / "autopal.config.json"
        config_path.write_text(json.dumps(config))

        monkeypatch.setenv("AUTOPAL_CONFIG_PATH", str(config_path))
        monkeypatch.setenv("AUTOPAL_BREAK_GLASS_SECRET", "dev-secret")

        for module_name in list(sys.modules.keys()):
            if module_name.startswith("services.autopal"):
                sys.modules.pop(module_name)

        module = importlib.import_module("services.autopal.app")
        client = TestClient(module.app)
        return client, config_path

    return factory


def merge_dict(dest: dict[str, Any], src: dict[str, Any]) -> None:
    for key, value in src.items():
        if isinstance(value, dict) and isinstance(dest.get(key), dict):
            merge_dict(dest[key], value)
        else:
            dest[key] = value


def merge_copy(base: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    merged = json.loads(json.dumps(base))
    merge_dict(merged, overrides)
    return merged


def mint_token(subject: str, ttl: int) -> str:
    now = int(time.time())
    payload = {"sub": subject, "iat": now, "exp": now + ttl}
    return jwt.encode(payload, key="dev-secret", algorithm="HS256")


def test_requires_step_up_header(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    client, _ = autopal_app(None)
    response = client.post("/secrets/materialize", json={"secret_id": "alpha"})
    assert response.status_code == 428


def test_break_glass_allows_maintenance_override(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    client, config_path = autopal_app(None)
    disable_global = {"feature_flags": {"global_enabled": False}}
    config_path.write_text(json.dumps(merge_copy(DEFAULT_CONFIG, disable_global)))

    response_blocked = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={"X-Step-Up-Approved": "true"},
    )
    assert response_blocked.status_code == 503

    token = mint_token("ops-oncall", ttl=300)
    response = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={
            "X-Step-Up-Approved": "true",
            "X-Break-Glass": token,
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "materialized"


def test_break_glass_rejected_on_non_allowlisted_route(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    client, _ = autopal_app(None)
    token = mint_token("ops-oncall", ttl=60)
    response = client.get("/healthz", headers={"X-Break-Glass": token})
    assert response.status_code == 403


def test_break_glass_ttl_enforced(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    overrides = {"break_glass": {"ttl_seconds": 60}}
    client, _ = autopal_app(overrides)
    now = int(time.time())
    long_token = jwt.encode(
        {"sub": "ops-oncall", "iat": now, "exp": now + 3600},
        key="dev-secret",
        algorithm="HS256",
    )
    response = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={
            "X-Step-Up-Approved": "true",
            "X-Break-Glass": long_token,
        },
    )
    assert response.status_code == 403

    short_token = mint_token("ops-oncall", ttl=30)
    response_ok = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={
            "X-Step-Up-Approved": "true",
            "X-Break-Glass": short_token,
        },
    )
    assert response_ok.status_code == 200


def test_break_glass_subject_allowlist(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    client, _ = autopal_app(None)
    token = mint_token("random-user", ttl=60)
    response = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={
            "X-Step-Up-Approved": "true",
            "X-Break-Glass": token,
        },
    )
    assert response.status_code == 403


def test_step_up_allows_request(
    autopal_app: Callable[[dict[str, Any] | None], tuple[TestClient, Path]]
) -> None:
    client, _ = autopal_app(None)
    response = client.post(
        "/secrets/materialize",
        json={"secret_id": "alpha"},
        headers={"X-Step-Up-Approved": "true"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "materialized"
