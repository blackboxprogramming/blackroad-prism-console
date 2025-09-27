import json

from enablement import paths
from enablement.utils import ART
from tools import storage


def test_path_and_assign(tmp_path):
    storage.write(str(ART / "assignments.json"), "[]")
    storage.write(str(ART / "history" / "assignments.json"), "[]")
    storage.write(str(ART / "actions.jsonl"), "")
    p = paths.new_path("SE Onboarding", "Solutions Engineer", ["C101", "C201"], 85)
    assert p.id == "SE_ONB"
    a = paths.assign(
        "U_SE01",
        p.id,
        "2025-10-30",
        "Route through core labs for onboarding week.",
        "model-1.0.0",
    )
    assert a.path_id == p.id
    assert a.rationale == "Route through core labs for onboarding week."
    data = json.loads(storage.read(str(ART / "assignments.json")))
    assert data[-1]["rationale"] == "Route through core labs for onboarding week."
    assert data[-1]["model_version"] == "model-1.0.0"

    paths.assign(
        "U_SE02",
        p.id,
        "2025-11-01",
        "Pair second cohort with mentor-led labs.",
        "model-1.0.0",
    )
    restored = paths.undo_last_assignment("lucidia", "Back out test cohort", "model-1.0.0")
    assert isinstance(restored, list)
    updated = json.loads(storage.read(str(ART / "assignments.json")))
    assert len(updated) == 1
