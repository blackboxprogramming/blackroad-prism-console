"""Auto remediation planner and executor."""
from __future__ import annotations

import glob
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional

from . import ARTIFACTS, _inc
from . import maintenance

# mapping from correlation kind to runbook action name
RUNBOOKS = {
    "brownout": {"action": "restart_coreapi"},
}


def plan(
    correlations: Iterable[dict],
    artifacts_dir: Path = ARTIFACTS,
) -> dict:
    """Create a remediation plan for the given correlations."""
    actions: List[dict] = []
    for c in correlations:
        rb = RUNBOOKS.get(c.get("kind"))
        if rb:
            actions.append({"correlation": c, "action": rb["action"]})
    plan_data = {"actions": actions}
    out_dir = artifacts_dir / "aiops"
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "plan.json", "w", encoding="utf-8") as fh:
        json.dump(plan_data, fh, indent=2)
    _inc("aiops_plans")
    return plan_data


def execute(
    plan_path: Path,
    dry_run: bool = False,
    artifacts_dir: Path = ARTIFACTS,
) -> dict:
    """Execute a remediation plan."""
    with open(plan_path, "r", encoding="utf-8") as fh:
        plan_data = json.load(fh)

    now = datetime.utcnow()
    exec_dir = artifacts_dir / "aiops" / f"exec_{now.strftime('%Y%m%d%H%M%S')}"
    exec_dir.mkdir(parents=True, exist_ok=True)
    log_path = exec_dir / "log.jsonl"
    results: List[dict] = []

    blocked = os.getenv("AIOPS_BLOCK_REMEDIATION") == "1"
    for act in plan_data.get("actions", []):
        service = act["correlation"].get("matched", {}).get("healthchecks", {}).get("service")
        win = maintenance.next_window(service, "remediate")
        if blocked or (win and datetime.utcnow().isoformat() < win.get("start", "")):
            status = "blocked"
            blocked = True
            _inc("aiops_exec_blocked")
        elif dry_run:
            status = "dry-run"
        else:
            status = "executed"
        entry = {"action": act["action"], "status": status}
        results.append(entry)
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")

    with open(exec_dir / "summary.md", "w", encoding="utf-8") as fh:
        for r in results:
            fh.write(f"- {r['action']}: {r['status']}\n")

    if not blocked:
        _inc("aiops_execs")
    return {"results": results, "blocked": blocked}


def load_correlations(pattern: str) -> List[dict]:
    """Utility to load correlation files matching a glob pattern."""
    data: List[dict] = []
    for path in glob.glob(pattern):
        with open(path, "r", encoding="utf-8") as fh:
            data.extend(json.load(fh))
    return data
