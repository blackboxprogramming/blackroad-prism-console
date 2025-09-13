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
        rec = _parse(line)
        if not _in_range(rec.get("timestamp", ""), start, end):
            continue
        skip = False
        for k, v in filter.items():
            if rec.get(k) != v:
                skip = True
                break
        if skip:
            continue
        processed += 1
        if mode == "verify":
            expected = rec.get("hash")
            actual = sha256(json.dumps(rec.get("output")).encode()).hexdigest()
            if expected != actual:
                mismatches += 1
        elif mode == "diff":
            expected = rec.get("expected", {})
            output = rec.get("output", {})
            delta = {k: output.get(k) for k in output if output.get(k) != expected.get(k)}
            if delta:
                deltas.append({"id": rec.get("id"), "delta": delta})
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
