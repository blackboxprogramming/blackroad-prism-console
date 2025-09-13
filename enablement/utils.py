from __future__ import annotations

import json
from pathlib import Path

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
