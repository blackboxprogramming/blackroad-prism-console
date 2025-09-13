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
