import json
from pathlib import Path
from typing import Any, Dict, List

REGISTRY = json.load(open(Path(__file__).with_name("mdm.json")))


def lookup(kind: str, id_: str) -> Dict[str, Any] | None:
    for item in REGISTRY.get(kind, []):
        if item.get("id") == id_:
            return item
    return None


def require_ids_or_fail(envelope: Dict[str, Any], required: List[str] | None = None) -> None:
    required = required or []
    for path in required:
        keys = path.split(".")
        cur: Any = envelope
        for k in keys:
            if not isinstance(cur, dict) or k not in cur:
                raise ValueError(f"Missing required id: {path}")
            cur = cur[k]
        registry_key = keys[0] + "s"
        if lookup(registry_key, cur) is None:
            raise ValueError(f"Unknown id: {cur}")
