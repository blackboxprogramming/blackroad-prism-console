from agents.codex._30_registrar.pipelines.zone_sync import diff_zone


def test_diff_zone_detects_add_remove_change():
    current = {
        "@": [
            {"type": "A", "value": "1.1.1.1", "ttl": 300},
            {"type": "TXT", "value": "v=spf1 include:_spf.google.com ~all", "ttl": 600},
        ],
        "www": [{"type": "CNAME", "value": "@", "ttl": 600}],
    }
    desired = {
        "@": [
            {"type": "A", "value": "1.1.1.1", "ttl": 300},
            {"type": "TXT", "value": "v=spf1 include:_spf.blackroad.io ~all", "ttl": 600},
        ],
        "api": [{"type": "CNAME", "value": "@", "ttl": 300}],
    }

    diffs = diff_zone(current, desired)

    actions = {entry["action"] for entry in diffs}
    assert {"add", "remove", "change"} == actions

    additions = [entry for entry in diffs if entry["action"] == "add"]
    assert additions[0]["name"] == "api"
    assert additions[0]["records"][0]["value"] == "@"

    removals = [entry for entry in diffs if entry["action"] == "remove"]
    assert removals[0]["name"] == "www"

    changes = [entry for entry in diffs if entry["action"] == "change"]
    assert changes[0]["from"]["value"].startswith("v=spf1 include:_spf.google")
    assert "blackroad" in changes[0]["to"]["value"]
