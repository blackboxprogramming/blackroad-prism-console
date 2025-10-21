from collections import Counter
from pathlib import Path
from typing import Any

from tools import storage

COUNTERS: Counter = Counter()

_EVENTS_PATH = Path(__file__).resolve().parent / "artifacts" / "events.jsonl"


def inc(name: str, amount: int = 1) -> None:
    COUNTERS[name] += amount


def record(event: str, data: dict[str, Any] | None = None) -> None:
    payload = {"event": event}
    if data:
        payload.update(data)
    storage.write(str(_EVENTS_PATH), payload)
