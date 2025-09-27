from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "enablement"


def record(metric: str, inc: int = 1) -> None:
    path = ART / "metrics.json"
    raw = storage.read(str(path))
    data = json.loads(raw) if raw else {}
    data[metric] = data.get(metric, 0) + inc
    storage.write(str(path), json.dumps(data, sort_keys=True))


def lake_write(table: str, record_data: dict) -> None:
    schema_path = ROOT / "contracts" / "schemas" / f"{table}.json"
    if schema_path.exists():
        try:
            import jsonschema
        except Exception:  # pragma: no cover
            jsonschema = None
        if jsonschema:
            schema = json.loads(storage.read(str(schema_path)))
            if schema.get("type") == "array":
                schema = schema.get("items", {})
            jsonschema.validate(record_data, schema)
    storage.write(str(ART / "lake" / f"{table}.jsonl"), record_data)


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _history_path(table: str) -> Path:
    return ART / "history" / f"{table}.json"


def store_previous_state(table: str, records: Iterable[Dict[str, Any]]) -> None:
    data = list(records)
    history_path = _history_path(table)
    raw = storage.read(str(history_path))
    history = json.loads(raw) if raw else []
    history.append({"timestamp": utc_now(), "data": data})
    storage.write(str(history_path), json.dumps(history, sort_keys=True))


def read_previous_state(table: str) -> list[dict]:
    history_path = _history_path(table)
    raw = storage.read(str(history_path))
    if not raw:
        return []
    history = json.loads(raw)
    if not history:
        return []
    last = history.pop()
    storage.write(str(history_path), json.dumps(history, sort_keys=True))
    return last.get("data", [])


def log_action(
    action: str,
    actor: str,
    rationale: str,
    model_version: str,
    metadata: Dict[str, Any] | None = None,
) -> None:
    entry = {
        "timestamp": utc_now(),
        "action": action,
        "actor": actor,
        "rationale": rationale,
        "model_version": model_version,
        "metadata": metadata or {},
    }
    storage.write(str(ART / "actions.jsonl"), entry)
