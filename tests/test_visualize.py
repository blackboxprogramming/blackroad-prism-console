import shutil

from kg.model import KG_ARTIFACTS
from kg.provenance import capture_event
from kg.visualize import export


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def test_visual_files():
    reset()
    capture_event({"type": "task", "id": "T1"})
    capture_event({"type": "artifact", "task_id": "T1", "bot": "Treasury-BOT", "path": "p"})
    export()
    assert (KG_ARTIFACTS / "kg_export.md").exists()
