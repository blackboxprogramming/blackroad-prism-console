from __future__ import annotations

from agents.codex._30_registrar.pipelines.zone_sync import apply_diff, diff_zone


def test_diff_zone_highlights_creates_updates_and_warnings():
    current = {
        "domain": "example.com",
        "records": [
            {"name": "@", "type": "A", "value": "1.1.1.1", "ttl": 600},
            {"name": "_dmarc", "type": "TXT", "value": "v=DMARC1; p=none", "ttl": 600},
        ],
    }
    desired = {
        "domain": "example.com",
        "records": [
            {"name": "@", "type": "A", "value": "1.1.1.1", "ttl": 300},
            {"name": "_dmarc", "type": "TXT", "value": "v=DMARC1; p=quarantine", "ttl": 300},
            {"name": "_acme-challenge", "type": "TXT", "value": "token", "ttl": 120},
        ],
    }

    diffs = diff_zone(current, desired)
    actions = {(diff.action, diff.record.name, diff.reason) for diff in diffs}

    assert ("update", "@", "attributes_changed") in actions
    assert any(diff.action == "create" and diff.record.name == "_acme-challenge" for diff in diffs)
    assert any(diff.action == "warn" and diff.reason == "ttl_below_minimum" for diff in diffs)

    updated = apply_diff(current, [diff for diff in diffs if diff.action in {"create", "update", "delete"}])
    assert any(record["name"] == "_acme-challenge" for record in updated["records"])


def test_diff_zone_flags_deleted_records():
    current = {
        "domain": "example.com",
        "records": [
            {"name": "old", "type": "TXT", "value": "legacy", "ttl": 600},
        ],
    }
    desired = {"domain": "example.com", "records": []}

    diffs = diff_zone(current, desired)
    assert diffs and diffs[0].action == "delete"
