"""SLO budget utilities."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict

from . import ARTIFACTS, _inc


def budget_status(
    service: str,
    window: str,
    data: Dict = None,
    artifacts_dir: Path = ARTIFACTS,
) -> dict:
    """Compute error budget status for a service."""
    if data is None:
        path = artifacts_dir / "slo" / f"{service}.json"
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    target = data.get("target", 1.0)
    errors = data.get("errors", 0.0)
    total_budget = max(1.0 - target, 1e-9)
    remaining = max(total_budget - errors, 0.0)
    remaining_pct = remaining / total_budget
    state = "ok"
    if remaining_pct == 0:
        state = "burning"
    elif remaining_pct < 0.5:
        state = "warn"

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_dir = artifacts_dir / "aiops"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = {"service": service, "window": window, "remaining_pct": remaining_pct, "state": state}
    with open(out_dir / f"slo_budget_{ts}.json", "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    if state != "ok":
        _inc("aiops_budget_alerts")
    return out
