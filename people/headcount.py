import csv
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

import yaml


def _read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open() as f:
        return list(csv.DictReader(f))


def forecast(plans_csv: Path, attrition_csv: Path, transfers_csv: Path, policy_yaml: Path) -> Tuple[List[Dict[str, str]], Dict[str, int]]:
    """Deterministic headcount forecast.

    Args:
        plans_csv: planned requisitions.
        attrition_csv: departures.
        transfers_csv: internal moves.
        policy_yaml: knobs like hiring_freeze and lead_time_days.
    Returns:
        Tuple of plan list and summary metrics.
    """
    policy = yaml.safe_load(policy_yaml.read_text())
    plans = _read_csv(plans_csv)
    attrition = _read_csv(attrition_csv)
    transfers = _read_csv(transfers_csv)

    if policy.get("hiring_freeze"):
        projected = []
    else:
        lead_time = int(policy.get("lead_time_days", 0))
        weights = policy.get("priority_weights", {})
        projected = []
        for row in plans:
            start = datetime.strptime(row["requested_start"], "%Y-%m-%d") + timedelta(days=lead_time)
            entry = dict(row)
            entry["projected_start"] = start.strftime("%Y-%m-%d")
            entry["weight"] = weights.get(row.get("priority", ""), 1)
            projected.append(entry)

    summary = {
        "planned": len(plans),
        "attrition": len(attrition),
        "transfers": len(transfers),
        "projected": len(projected),
        "budget": int(policy.get("approval_limits", len(projected))),
    }
    return projected, summary


def write_artifacts(out_dir: Path, plan: List[Dict[str, str]], summary: Dict[str, int]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "plan.json").write_text(json.dumps(plan, indent=2))
    lines = ["# Headcount Summary", ""]
    for k, v in summary.items():
        lines.append(f"- {k}: {v}")
    (out_dir / "summary.md").write_text("\n".join(lines))
