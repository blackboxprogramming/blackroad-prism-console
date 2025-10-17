from __future__ import annotations

import json
from pathlib import Path

from tools import storage, metrics, artifacts
from . import ARTIFACTS, ROOT

LAKE_PATH = ARTIFACTS / "merge"
PROGRAM_BOARD = ROOT / "program" / "board.json"
MERGE_SCHEMA = "contracts/schemas/rnd_merge.json"


def merge(idea_id: str) -> None:
    exp_dir = ARTIFACTS / "experiments"
    exp = None
    for path in exp_dir.glob("E*/experiment.json"):
        data = json.loads(storage.read(str(path)))
        if data.get("idea_id") == idea_id:
            exp = data
            break
    if not exp or not exp.get("decision"):
        raise RuntimeError("DUTY_EXP_DECISION_MISSING")
    item = {
        "idea_id": idea_id,
        "experiment_id": exp["id"],
        "decision": exp["decision"],
    }
    artifacts.validate_and_write(str(LAKE_PATH / f"{idea_id}.json"), item, MERGE_SCHEMA)
    board = json.loads(storage.read(str(PROGRAM_BOARD)) or "[]")
    board.append(item)
    storage.write(str(PROGRAM_BOARD), json.dumps(board))
    metrics.emit("rnd_merge_proposed")
