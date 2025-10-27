from __future__ import annotations

from agents.codex._34_integrator.pipelines.normalize_event import NormalizationError, normalize


def test_normalize_event_uses_mapper() -> None:
    event = {
        "source": "github",
        "payload": {
            "id": "evt-1",
            "event_type": "push",
            "ts": "2024-01-01T00:00:00Z",
            "repository": {"name": "demo"},
            "action": "created",
            "actor": {"login": "alice"},
        },
    }

    normalized = normalize(event)

    assert normalized["id"] == "evt-1"
    assert normalized["type"] == "push"
    assert normalized["data"]["repository"] == "demo"
    assert normalized["metadata"]["mapper_version"] == "2024.09"
    assert normalized["metadata"]["consent_scope"] == ["read:repo"]


def test_normalize_event_generates_defaults() -> None:
    event = {
        "source": "slack",
        "payload": {
            "type": "message",
            "event_ts": "2024-02-02T00:00:00Z",
            "channel": "C123",
            "text": "hello",
            "user": "U1",
        },
    }

    normalized = normalize(event)

    assert normalized["source"] == "slack"
    assert normalized["id"]
    assert normalized["timestamp"].startswith("2024-02-02")
    assert normalized["metadata"]["consent_scope"] == ["post:chat"]


def test_normalize_event_requires_payload_dict() -> None:
    event = {"source": "github", "payload": "not-a-dict"}
    try:
        normalize(event)
    except NormalizationError as exc:
        assert "dictionary" in str(exc)
    else:  # pragma: no cover - defensive
        raise AssertionError("Normalization should have failed")
