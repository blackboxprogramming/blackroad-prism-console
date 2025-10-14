from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from tools import storage

_metrics_path = Path(__file__).resolve().with_name("metrics.json")

try:
    _metrics: Dict[str, Dict[str, int]] = json.loads(storage.read(str(_metrics_path)))
except Exception:
    _metrics = {"counters": {}, "gauges": {}}


def _save() -> None:
    storage.write(str(_metrics_path), _metrics)


def inc(name: str, amount: int = 1) -> None:
    cnt = _metrics.setdefault("counters", {})
    cnt[name] = cnt.get(name, 0) + amount
    _save()


def gauge(name: str, value: int) -> None:
    g = _metrics.setdefault("gauges", {})
    g[name] = value
    _save()


def read() -> Dict[str, Dict[str, int]]:
    return _metrics
