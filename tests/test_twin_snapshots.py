import json

from twin import snapshots


def test_snapshot_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr(snapshots, "ROOT", tmp_path)
    monkeypatch.setattr(snapshots, "CHECKPOINT_ROOT", tmp_path / "cp")
    (tmp_path / "orchestrator").mkdir()
    f = tmp_path / "orchestrator" / "a.txt"
    f.write_text("hello", encoding="utf-8")
    snapshots.create_checkpoint("snap", include=["orchestrator"])
    f.write_text("changed", encoding="utf-8")
    snapshots.restore_checkpoint("snap")
    assert f.read_text() == "hello"
    cps = snapshots.list_checkpoints()
    assert cps[0]["name"] == "snap"
    manifest = json.loads((tmp_path / "cp" / "snap" / "manifest.json").read_text())
    assert manifest["files"]
