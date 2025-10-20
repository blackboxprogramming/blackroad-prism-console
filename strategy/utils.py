from __future__ import annotations

import json
from pathlib import Path
from typing import Any, List

from tools import storage, metrics

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "strategy"
LAKE = ARTIFACTS / "lake"
SCHEMAS = ROOT / "contracts" / "schemas"


def _ensure_dir(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)


def load_json_list(path: Path) -> List[dict]:
    if not path.exists():
        return []
    data = json.loads(storage.read(str(path)) or "[]")
    return data


def write_json_list(path: Path, data: List[dict]) -> None:
    _ensure_dir(path)
    storage.write(str(path), json.dumps(data, indent=2))


def next_id(prefix: str, existing: List[dict]) -> str:
    idx = len(existing) + 1
    return f"{prefix}{idx:03d}"


def validate_and_write(table: str, record: dict) -> None:
    schema_path = SCHEMAS / f"{table}.json"
    if schema_path.exists():
        schema = json.loads(storage.read(str(schema_path)))
        required = set(schema.get("required", []))
        if not required.issubset(record.keys()):
            missing = required - set(record.keys())
            raise ValueError(f"schema violation for {table}: missing {missing}")
    _ensure_dir(LAKE / f"{table}.jsonl")
    storage.write(str(LAKE / f"{table}.jsonl"), record)
