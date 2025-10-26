"""Tests for PII scrubbing utilities."""

from agents.codex._28_auditor.pipelines.scrub_pii import MASK_TOKEN, scrub


def test_scrub_masks_sensitive_fields_without_mutating_source():
    payload = {
        "email": "person@example.com",
        "notes": "Reach me at 555-123-4567 or person@example.com",
        "nested": {"phone": "(555) 222-1111"},
    }
    original = payload.copy()

    cleaned = scrub(payload)

    assert cleaned["email"] == MASK_TOKEN
    assert cleaned["nested"]["phone"] == MASK_TOKEN
    assert cleaned["notes"].count(MASK_TOKEN) == 2
    assert payload == original


def test_scrub_hash_strategy_generates_deterministic_digest():
    payload = {"token": "secret-token"}
    first, _ = scrub(payload, strategy="hash-salt", return_diffs=True)
    second, _ = scrub(payload, strategy="hash-salt", return_diffs=True)
    assert first["token"] == second["token"]
    assert first["token"] != payload["token"]
