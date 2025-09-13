"""Offline canary analysis."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict
from datetime import datetime

import yaml

from . import ARTIFACTS, ROOT, _inc

CONFIG = ROOT / "configs" / "aiops" / "canary.yaml"


def _load_thresholds() -> Dict[str, float]:
    with open(CONFIG, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return data.get("thresholds", {})


def analyze(
    base_path: Path,
    canary_path: Path,
    artifacts_dir: Path = ARTIFACTS,
) -> dict:
    """Compare two metric snapshots and output diff."""
    with open(base_path, "r", encoding="utf-8") as fh:
        base = json.load(fh)
    with open(canary_path, "r", encoding="utf-8") as fh:
        canary = json.load(fh)

    thr = _load_thresholds()
    deltas = {}
    failed = False
    for key in ["latency_p50", "latency_p95", "error_rate"]:
        b = base.get(key, 0)
        c = canary.get(key, 0)
        delta = c - b
        deltas[key] = delta
        if abs(delta) > thr.get(key, float("inf")):
            failed = True
    result = "FAIL" if failed else "PASS"

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_dir = artifacts_dir / "aiops" / f"canary_{ts}"
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "diff.json", "w", encoding="utf-8") as fh:
        json.dump({"deltas": deltas, "result": result}, fh, indent=2)
    with open(out_dir / "report.md", "w", encoding="utf-8") as fh:
        fh.write(f"Result: {result}\n")
        for k, v in deltas.items():
            fh.write(f"{k}: {v}\n")

    _inc("aiops_correlations")  # reuse metric for simplicity
    return {"deltas": deltas, "result": result}
