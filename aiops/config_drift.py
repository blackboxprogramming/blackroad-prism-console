"""Config drift detection."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple

from . import ARTIFACTS, _inc

BASELINE = ARTIFACTS / "aiops" / "config_baseline.json"

SEVERITY_RULES = {"version": "critical"}


def record_baseline(snapshot: Dict, artifacts_dir: Path = ARTIFACTS) -> None:
    out_dir = artifacts_dir / "aiops"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "config_baseline.json"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(snapshot, fh, indent=2)


def _diff(base: Dict, curr: Dict, prefix: str = "") -> Dict[str, Tuple[object, object]]:
    changes: Dict[str, Tuple[object, object]] = {}
    keys = set(base) | set(curr)
    for k in keys:
        p = f"{prefix}{k}"
        if k not in base:
            changes[p] = (None, curr[k])
        elif k not in curr:
            changes[p] = (base[k], None)
        elif isinstance(base[k], dict) and isinstance(curr[k], dict):
            changes.update(_diff(base[k], curr[k], p + "."))
        elif base[k] != curr[k]:
            changes[p] = (base[k], curr[k])
    return changes


def compare(snapshot: Dict = None, artifacts_dir: Path = ARTIFACTS) -> dict:
    path = artifacts_dir / "aiops" / "config_baseline.json"
    if not path.exists():
        raise FileNotFoundError("baseline not recorded")
    with open(path, "r", encoding="utf-8") as fh:
        base = json.load(fh)
    curr = snapshot if snapshot is not None else base
    diffs = _diff(base, curr)
    items = []
    for k, (b, c) in diffs.items():
        items.append({"path": k, "baseline": b, "current": c, "severity": SEVERITY_RULES.get(k, "warning")})
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_dir = artifacts_dir / "aiops"
    with open(out_dir / f"drift_{ts}.json", "w", encoding="utf-8") as fh:
        json.dump({"diff": items}, fh, indent=2)
    with open(out_dir / "drift.md", "w", encoding="utf-8") as fh:
        for i in items:
            fh.write(f"- {i['path']}: {i['baseline']} -> {i['current']} ({i['severity']})\n")
    if items:
        _inc("aiops_drift_detected")
    return {"diff": items}
