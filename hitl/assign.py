import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple

import yaml

from tools import storage
from . import queue

ROOT = Path(__file__).resolve().parents[1]
def _reviewer_file() -> Path:
    return Path(os.environ.get("HITL_REVIEWERS_FILE", ROOT / "config" / "reviewers.yaml"))


def _load_cfg():
    file = _reviewer_file()
    if file.exists():
        return yaml.safe_load(file.read_text())
    return {}


def auto_assign(review_type: str) -> None:
    cfg = _load_cfg()
    reviewers: List[str] = cfg.get(review_type, {}).get("reviewers", [])
    if not reviewers:
        return
    counter_path = ROOT / "hitl" / f"{review_type}_rr.txt"
    idx = int(storage.read(str(counter_path)) or 0)
    items = queue.list_items(status="pending")
    for item in items:
        if item.type == review_type and not item.reviewers:
            assigned = reviewers[idx % len(reviewers)]
            item.reviewers = [assigned]
            queue._append(item)
            idx += 1
    storage.write(str(counter_path), str(idx))


def sla_report(now: datetime | None = None) -> List[Tuple[str, float]]:
    now = now or datetime.utcnow()
    cfg = _load_cfg()
    items = queue.list_items(status="pending")
    report = []
    for item in items:
        sla_h = cfg.get(item.type, {}).get("sla_hours", 24)
        created = datetime.fromisoformat(item.created_at)
        remaining = (created + timedelta(hours=sla_h) - now).total_seconds()
        report.append((item.id, remaining))
    return report

