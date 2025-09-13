import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

STAGES = ["applied", "screen", "interview", "offer", "accept", "reject"]


def load_reqs(dir_path: Path) -> List[Dict[str, str]]:
    data = []
    for p in sorted(dir_path.glob("*.jsonl")):
        with p.open() as f:
            for line in f:
                data.append(json.loads(line))
    return data


def funnel(data: List[Dict[str, str]]) -> Dict[str, float]:
    counts = defaultdict(int)
    for item in data:
        counts[item["stage"]] += 1
    rates = {}
    prev = None
    for stage in STAGES:
        if prev is None:
            rates[stage] = counts.get(stage, 0)
        else:
            prev_count = counts.get(prev, 1)
            rates[stage] = counts.get(stage, 0) / prev_count if prev_count else 0.0
        prev = stage
    return rates


def stage_sla(data: List[Dict[str, str]]) -> Dict[str, float]:
    # average days spent in each stage
    durations = defaultdict(list)
    by_candidate = defaultdict(list)
    for item in data:
        by_candidate[item["candidate"]].append(item)
    for cand, events in by_candidate.items():
        events.sort(key=lambda e: e["ts"])
        for i in range(1, len(events)):
            prev, cur = events[i - 1], events[i]
            start = datetime.fromisoformat(prev["ts"]) 
            end = datetime.fromisoformat(cur["ts"])
            durations[cur["stage"]].append((end - start).days)
    return {k: (sum(v) / len(v)) if v else 0.0 for k, v in durations.items()}


def time_to_fill(data: List[Dict[str, str]]) -> Dict[str, float]:
    # per req id
    times: Dict[str, List[int]] = defaultdict(list)
    by_req = defaultdict(list)
    for item in data:
        by_req[item["req"]].append(item)
    for req, events in by_req.items():
        events.sort(key=lambda e: e["ts"])
        if events:
            start = datetime.fromisoformat(events[0]["ts"])
            end = datetime.fromisoformat(events[-1]["ts"])
            times[req].append((end - start).days)
    return {k: sum(v) / len(v) for k, v in times.items() if v}


def write_artifacts(out_dir: Path, data: List[Dict[str, str]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "kanban.json").write_text(json.dumps(data, indent=2))
    fun = funnel(data)
    (out_dir / "funnel.md").write_text("\n".join([f"{k}: {v}" for k, v in fun.items()]))
    sla = stage_sla(data)
    (out_dir / "slas.md").write_text("\n".join([f"{k}: {v}" for k, v in sla.items()]))
