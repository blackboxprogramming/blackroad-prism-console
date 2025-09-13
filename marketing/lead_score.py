import json
from datetime import datetime
from pathlib import Path
from typing import Dict

import yaml

from tools import artifacts, metrics, storage

from .segments import _load_contacts, _load_events

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"
NOW = datetime(2025, 1, 3)


def score_leads(config_path: str) -> Dict[str, float]:
    cfg = yaml.safe_load(Path(config_path).read_text())
    events = _load_events()
    contacts = _load_contacts()
    scores: Dict[str, float] = {}
    for cid in contacts:
        pts = 0.0
        for ev in events.get(cid, []):
            pts += cfg.get("events", {}).get(ev.get("type"), 0)
        if events.get(cid):
            last = max(datetime.fromisoformat(e["ts"]) for e in events[cid])
            idle = (NOW - last).days
            pts -= cfg.get("decay_per_day", 0) * idle
        boost_cfg = cfg.get("firmographic_boost", {}).get("company_size", {})
        pts += boost_cfg.get(contacts[cid].get("company_size"), 0)
        if pts < 0:
            pts = 0
        scores[cid] = pts
    artifacts.validate_and_write(str(ARTIFACTS_DIR / "lead_scores.json"), scores)
    buckets = {"A": 0, "B": 0, "C": 0, "D": 0}
    for cid, sc in scores.items():
        bucket = "D"
        for b, thr in cfg.get("buckets", {}).items():
            if sc >= thr:
                bucket = b
                break
        buckets[bucket] += 1
        rec = {"contact_id": cid, "score": sc, "bucket": bucket}
        artifacts.validate_and_write(
            str(LAKE / "lead_scores.jsonl"),
            rec,
            schema_path=str(CONTRACTS / "lead_scores.schema.json"),
        )
    lines = ["# Lead Score Buckets"]
    for b, c in buckets.items():
        lines.append(f"- {b}: {c}")
    storage.write(str(ARTIFACTS_DIR / "score_buckets.md"), "\n".join(lines))
    metrics.emit("lead_scores_written")
    return scores
