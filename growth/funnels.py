from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "fixtures" / "product" / "events.jsonl"
ARTIFACTS = ROOT / "artifacts" / "growth" / "funnels"


def build(steps: List[str], start: str, end: str) -> Dict:
    data = [json.loads(line) for line in EVENTS.read_text().splitlines() if line.strip()]
    start_dt = datetime.fromisoformat(start)
    end_dt = datetime.fromisoformat(end)
    user_events = defaultdict(dict)
    for d in data:
        ts = datetime.fromisoformat(d["ts"])
        if not (start_dt <= ts <= end_dt):
            continue
        user_events[d["user"]][d["event"]] = ts
    counts = []
    prev = None
    for step in steps:
        c = sum(1 for u, ev in user_events.items() if step in ev and (prev is None or prev in ev))
        counts.append(c)
        prev = step
    drop = [1 - counts[i]/counts[i-1] if i>0 and counts[i-1] else 0 for i in range(len(counts))]
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "table.csv").write_text("step,count,dropoff\n" + "\n".join(f"{s},{c},{d:.2f}" for s,c,d in zip(steps,counts,drop)))
    (ARTIFACTS / "report.md").write_text("\n".join(f"{s}: {c}" for s,c in zip(steps,counts)))
    return {"counts": counts, "dropoff": drop}
