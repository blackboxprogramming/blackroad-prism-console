from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from tools import storage

from .registry import ARTIFACTS, load_registry


def build(exp_id: str) -> Dict:
    registry = load_registry()
    exp = registry[exp_id]
    result_path = ARTIFACTS / exp_id / "result.json"
    result = json.loads(result_path.read_text()) if result_path.exists() else {}
    decision = result.get("decision", "hold")
    out_dir = ARTIFACTS / f"review_{exp_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.md").write_text(f"Experiment {exp_id} decision: {decision}")
    storage.write(str(ARTIFACTS / "decisions.jsonl"), {"id": exp_id, "decision": decision})
    return {"decision": decision}
