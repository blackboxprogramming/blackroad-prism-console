from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from typing import Iterable, Mapping

from tools import storage

from .utils import ART

REPORT_PATH = ART / "bias_report.json"


def _as_percent(part: int, total: int) -> float:
    if not total:
        return 0.0
    return round((part / total) * 100, 2)


def generate_assignment_bias_report(assignments: Iterable[Mapping[str, object]]) -> dict:
    records = list(assignments)
    total = len(records)
    by_user = Counter(rec.get("user_id") for rec in records)
    over_representation = [
        {
            "user_id": user,
            "assignments": count,
            "share_percent": _as_percent(count, total),
        }
        for user, count in by_user.items()
        if total and (count / total) > 0.4
    ]

    by_path = Counter(rec.get("path_id") for rec in records)
    under_representation = [
        {
            "path_id": path,
            "assignments": count,
            "share_percent": _as_percent(count, total),
        }
        for path, count in by_path.items()
        if total and (count / total) < 0.1
    ]

    report = {
        "generated_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "total_assignments": total,
        "over_representation_flags": over_representation,
        "under_representation_flags": under_representation,
        "false_positive_flags": [],
        "false_negative_flags": [],
        "notes": "Flags are heuristic: over-representation >40% share, under-representation <10% share.",
    }
    storage.write(str(REPORT_PATH), json.dumps(report, indent=2))
    return report
