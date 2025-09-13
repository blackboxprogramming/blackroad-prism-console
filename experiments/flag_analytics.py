from __future__ import annotations

import json
import statistics
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "fixtures" / "product" / "events.jsonl"


def impact(feature: str, window: int) -> Dict:
    data = [json.loads(line) for line in EVENTS.read_text().splitlines() if line.strip()]
    with_flag = [d.get("value", 0) for d in data if feature in d.get("feature_flags", []) and d.get("event") == "purchase"]
    without_flag = [d.get("value", 0) for d in data if feature not in d.get("feature_flags", []) and d.get("event") == "purchase"]
    avg_with = statistics.mean(with_flag) if with_flag else 0
    avg_without = statistics.mean(without_flag) if without_flag else 0
    diff = avg_with - avg_without
    return {"with": avg_with, "without": avg_without, "diff": diff}
