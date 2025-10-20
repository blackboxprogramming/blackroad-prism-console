from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def load_golden(domain: str) -> List[Dict[str, Any]]:
    content = storage.read(str(ARTIFACTS / "golden" / f"{domain}.json"))
    data = json.loads(content) if content else {}
    return data.get("rows", [])


def diff(domain: str) -> Dict[str, Any]:
    current = load_golden(domain)
    prev_path = ARTIFACTS / "lineage" / f"prev_{domain}.json"
    prev_rows = []
    if prev_path.exists():
        prev_rows = json.loads(prev_path.read_text()).get("rows", [])
    prev_ids = { (r.get("source"), r.get("source_id")) for r in prev_rows }
    curr_ids = { (r.get("source"), r.get("source_id")) for r in current }
    adds = list(curr_ids - prev_ids)
    removes = list(prev_ids - curr_ids)
    summary = {"adds": len(adds), "removes": len(removes)}
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_path = ARTIFACTS / "lineage" / f"{domain}_{ts}.json"
    artifacts.validate_and_write(str(out_path), summary, None)
    artifacts.validate_and_write(str(prev_path), {"rows": current}, None)
    artifacts.validate_and_write(str(ARTIFACTS / "impact.md"), f"adds={summary['adds']} removes={summary['removes']}", None)
    return summary

