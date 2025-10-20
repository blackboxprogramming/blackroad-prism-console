from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Any

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def latest_dq_file(domain: str) -> Path | None:
    dq_dir = ARTIFACTS / "dq"
    if not dq_dir.exists():
        return None
    files = sorted(dq_dir.glob(f"{domain}_*.json"))
    return files[-1] if files else None


def queue(domain: str, owner: str = "steward", sla_days: int = 5) -> List[Dict[str, Any]]:
    dq_file = latest_dq_file(domain)
    if not dq_file:
        return []
    data = json.loads(dq_file.read_text())
    items: List[Dict[str, Any]] = []
    for check in data.get("checks", []):
        if check["violations"]:
            items.append({
                "domain": domain,
                "code": check["code"],
                "owner": owner,
                "sla_days": sla_days,
            })
    out_path = ARTIFACTS / "steward_queue.json"
    artifacts.validate_and_write(str(out_path), items, None)
    return items

