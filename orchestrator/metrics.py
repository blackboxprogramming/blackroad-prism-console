from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from pathlib import Path

from tools.storage import append_text

_METRICS_PATH = Path("orchestrator/metrics.jsonl")
COUNTERS: Counter[str] = Counter()


def record(event: str, **data: str) -> None:
    COUNTERS[event] += 1
    payload = {"timestamp": datetime.utcnow().isoformat(), "event": event, **data}
    line = json.dumps(payload)
    append_text(_METRICS_PATH, line + "\n")
