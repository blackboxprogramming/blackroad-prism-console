"""Simple JSON lines metrics logging for the orchestrator."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

METRICS_PATH = Path("orchestrator/metrics.jsonl")


def log_metric(metric_type: str, task_id: str, **extra: Any) -> None:
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": metric_type,
        "task_id": task_id,
    }
    record.update(extra)
    with METRICS_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

