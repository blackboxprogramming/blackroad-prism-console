import json
from pathlib import Path

from twin import snapshots


def test_checkpoint_restore(tmp_path):
    src = Path("orchestrator/test_file.txt")
    src.write_text("hello")
    name = "cp_test"
    snapshots.create_checkpoint(name, include=["orchestrator"])
    src.write_text("changed")
    snapshots.restore_checkpoint(name)
    assert src.read_text() == "hello"
    manifest = json.loads((Path("artifacts/twin/checkpoints") / name / "manifest.json").read_text())
    assert manifest["name"] == name
    src.unlink()
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
