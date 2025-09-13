import json
from hashlib import sha256

from twin import replay


def test_replay_modes(tmp_path, monkeypatch):
    mem = tmp_path / "memory.jsonl"
    r1 = {"id": "1", "timestamp": "2025-01-01T00:00:00", "output": {"a": 1}}
    r1["hash"] = sha256(json.dumps(r1["output"]).encode()).hexdigest()
    r2 = {"id": "2", "timestamp": "2025-01-01T01:00:00", "output": {"a": 2}, "expected": {"a": 1}}
    with mem.open("w", encoding="utf-8") as fh:
        fh.write(json.dumps(r1) + "\n")
        fh.write(json.dumps(r2) + "\n")
    monkeypatch.chdir(tmp_path)
    rep = replay.replay("2025-01-01T00:00:00", "2025-01-01T02:00:00")
    assert rep.count == 2 and rep.mismatches == 1
    rep2 = replay.replay("2025-01-01T00:00:00", "2025-01-01T02:00:00", mode="diff")
    assert rep2.count == 2
    deltas = list((tmp_path / "artifacts/twin").glob("replay_*/deltas.json"))
    assert deltas
