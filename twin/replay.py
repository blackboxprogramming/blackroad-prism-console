from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List

from tools import storage
from . import incr

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
MEMORY = ROOT / "orchestrator" / "memory.jsonl"


def _hash(data: Dict) -> str:
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


@dataclass
class ReplayReport:
    total: int
    mismatches: int
    deltas: Dict[str, Dict]


def _iter_records(range_from: Optional[str], range_to: Optional[str], flt: Dict[str, str]):
    if not MEMORY.exists():
        return []
    start = datetime.fromisoformat(range_from) if range_from else None
    end = datetime.fromisoformat(range_to) if range_to else None
    for line in storage.read(str(MEMORY)).splitlines():
        rec = json.loads(line)
        ts = datetime.fromisoformat(rec["ts"])
        if start and ts < start:
            continue
        if end and ts > end:
            continue
        match = True
        for k, v in flt.items():
            if rec.get(k) != v:
                match = False
                break
        if match:
            yield rec


def replay(range_from: Optional[str] = None, range_to: Optional[str] = None, flt: Optional[Dict[str, str]] = None, mode: str = "verify") -> ReplayReport:
    flt = flt or {}
    mismatches = 0
    deltas: Dict[str, Dict] = {}
    total = 0
    for rec in _iter_records(range_from, range_to, flt):
        total += 1
        expected = rec.get("response")
        h = _hash(expected)
        if mode == "verify":
            if rec.get("hash") and rec["hash"] != h:
                mismatches += 1
        elif mode == "diff":
            orig = rec.get("expected", {})
            diff = {}
            for k in expected.keys() | orig.keys():
                if expected.get(k) != orig.get(k):
                    diff[k] = {"left": orig.get(k), "right": expected.get(k)}
            if diff:
                deltas[rec["ts"]] = diff
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_dir = ARTIFACTS / f"twin/replay_{ts}"
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "total": total,
        "mismatches": mismatches,
    }
    storage.write(str(out_dir / "summary.md"), json.dumps(summary))
    storage.write(str(out_dir / "deltas.json"), deltas)
    storage.write(str(out_dir / "perf.csv"), "index,duration\n")
    incr("twin_replay_run")
    return ReplayReport(total=total, mismatches=mismatches, deltas=deltas)
