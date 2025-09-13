from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any, Dict, List

from orchestrator import metrics
from tools import storage

_lineage_path = Path(__file__).resolve().with_name("lineage.jsonl")
_active: Dict[str, Dict[str, Any]] = {}


def start_trace(task_id: str) -> str:
    trace_id = uuid.uuid4().hex
    _active[trace_id] = {"task_id": task_id, "usage": []}
    metrics.inc("lineage_events")
    return trace_id


def record_usage(trace_id: str, dataset: str, columns: List[str]) -> None:
    if trace_id in _active:
        _active[trace_id]["usage"].append({"dataset": dataset, "columns": columns})
        metrics.inc("lineage_events")


def finalize(trace_id: str) -> None:
    record = _active.pop(trace_id, None)
    if record is None:
        return
    record["trace_id"] = trace_id
    storage.write(str(_lineage_path), record)
    metrics.inc("lineage_events")
