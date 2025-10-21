import json
from pathlib import Path
from hashlib import sha256

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
def test_replay_modes(tmp_path, monkeypatch):
    mem = tmp_path / "memory.jsonl"
    r1_response = {"summary": "ok", "risks": ["none"]}
    r2_response = {"summary": "drift", "risks": ["none"]}
    r1 = {
        "ts": "2025-01-01T00:00:00",
        "bot": "alpha",
        "task": {"id": "t1"},
        "response": r1_response,
        "expected": r1_response,
    }
    r2 = {
        "ts": "2025-01-01T01:00:00",
        "bot": "alpha",
        "task": {"id": "t2"},
        "response": r2_response,
        "expected": {"summary": "ok", "risks": ["none"]},
    }
    with mem.open("w", encoding="utf-8") as fh:
        fh.write(json.dumps(r1) + "\n")
        fh.write(json.dumps(r2) + "\n")
    monkeypatch.chdir(tmp_path)

    rep = replay.replay("2025-01-01T00:00:00", "2025-01-01T02:00:00")
    assert rep.count == 2
    assert rep.mismatches == 1

    rep2 = replay.replay("2025-01-01T00:00:00", "2025-01-01T02:00:00", mode="diff")
    assert rep2.count == 2

    delta_files = list((tmp_path / "artifacts/twin").glob("replay_*/deltas.json"))
    assert delta_files
    with delta_files[-1].open(encoding="utf-8") as fh:
        payload = json.load(fh)
    assert payload == [{"id": "t2", "delta": {"summary": "drift"}}]
