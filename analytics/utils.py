import hashlib
import json
from pathlib import Path
from typing import Any

import jsonschema

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"
MEMORY = ROOT / "orchestrator" / "memory.jsonl"
METRICS = ROOT / "artifacts" / "metrics.json"


def validate(instance: Any, schema_name: str) -> None:
    schema_path = SCHEMAS / schema_name
    schema = json.loads(schema_path.read_text())
    jsonschema.validate(instance=instance, schema=schema)


def log_event(event: dict) -> None:
    text = json.dumps(event, sort_keys=True)
    sig = hashlib.sha256(text.encode("utf-8")).hexdigest()
    storage.write(str(MEMORY), {**event, "signature": sig})


def increment(metric: str) -> None:
    data = json.loads(storage.read(str(METRICS)) or "{}")
    data[metric] = data.get(metric, 0) + 1
    storage.write(str(METRICS), data)
