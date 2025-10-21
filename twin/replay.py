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
import json
from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from typing import Dict, List, Optional

from bench.runner import METRICS_PATH
from tools import storage

from .clock import now
from .policy_sandbox import get_active_packs

ARTIFACTS = Path("artifacts/twin")


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
    count: int
    mismatches: int


def _parse(line: str) -> Dict:
    return json.loads(line)


def _in_range(ts: str, start: datetime, end: datetime) -> bool:
    try:
        dt = datetime.fromisoformat(ts)
    except ValueError:
        return False
    return start <= dt <= end


def _normalize_record(record: Dict) -> Dict:
    """Convert orchestrator memory records into a uniform structure."""

    timestamp = record.get("timestamp") or record.get("ts") or ""

    output = record.get("output")
    if output is None:
        output = record.get("response")

    expected = record.get("expected")

    record_hash = record.get("hash")
    if record_hash is None and expected is not None:
        record_hash = sha256(json.dumps(expected, sort_keys=True).encode()).hexdigest()

    identifier = record.get("id")
    if identifier is None:
        task = record.get("task") or {}
        identifier = task.get("id") or task.get("task_id")

    return {
        "timestamp": timestamp,
        "output": output,
        "expected": expected,
        "hash": record_hash,
        "id": identifier,
    }


def replay(
    range_from: str, range_to: str, filter: Optional[Dict] = None, mode: str = "verify"
) -> ReplayReport:
    filter = filter or {}
    start = datetime.fromisoformat(range_from)
    end = datetime.fromisoformat(range_to)
    out_dir = ARTIFACTS / f"replay_{int(now().timestamp())}"
    out_dir.mkdir(parents=True, exist_ok=True)
    memory_path = Path("memory.jsonl")
    mismatches = 0
    processed = 0
    deltas: List[Dict] = []
    for line in memory_path.read_text().splitlines():
        raw = _parse(line)
        normalized = _normalize_record(raw)
        if not _in_range(normalized.get("timestamp", ""), start, end):
            continue
        skip = False
        for k, v in filter.items():
            if raw.get(k) != v:
                skip = True
                break
        if skip:
            continue
        output = normalized.get("output")
        if output is None:
            continue
        processed += 1
        if mode == "verify":
            expected_hash = normalized.get("hash")
            if expected_hash:
                actual = sha256(json.dumps(output, sort_keys=True).encode()).hexdigest()
                if expected_hash != actual:
                    mismatches += 1
        elif mode == "diff":
            expected = normalized.get("expected") or {}
            delta = {
                key: output.get(key)
                for key in output
                if output.get(key) != expected.get(key)
            }
            if delta:
                deltas.append({"id": normalized.get("id"), "delta": delta})
    (out_dir / "summary.md").write_text(
        f"processed: {processed}\nmode: {mode}\npolicy_packs: {','.join(get_active_packs())}",
        encoding="utf-8",
    )
    if deltas:
        (out_dir / "deltas.json").write_text(json.dumps(deltas, indent=2), encoding="utf-8")
    (out_dir / "perf.csv").write_text(
        "metric,value\ncount,{processed}\n".replace("{processed}", str(processed)), encoding="utf-8"
    )
    storage.write(str(METRICS_PATH), {"event": "twin_replay_run", "mode": mode})
    return ReplayReport(count=processed, mismatches=mismatches)
