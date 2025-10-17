import json
from pathlib import Path

from twin import replay


def test_replay_verify_and_diff():
    mem = Path("orchestrator/memory.jsonl")
    original = mem.read_text()
    try:
        rec1 = {
            "ts": "2025-07-01T00:00:00",
            "response": {"value": 1},
            "hash": replay._hash({"value": 1}),
        }
        rec2 = {
            "ts": "2025-07-02T00:00:00",
            "response": {"value": 2},
            "expected": {"value": 1},
        }
        mem.write_text(json.dumps(rec1) + "\n" + json.dumps(rec2) + "\n")
        report = replay.replay("2025-07-01T00:00:00", "2025-07-03T00:00:00")
        assert report.total == 2
        assert report.mismatches == 0
        diff_report = replay.replay("2025-07-01T00:00:00", "2025-07-03T00:00:00", mode="diff")
        assert "2025-07-02T00:00:00" in diff_report.deltas
    finally:
        mem.write_text(original)
