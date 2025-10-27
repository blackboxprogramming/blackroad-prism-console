"""Schema drift detection for Codex-34."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Set

from .normalize_event import _load_mapper  # type: ignore

_ROOT = Path(__file__).resolve().parent.parent


def _paths_from_mapping(mapper: Dict[str, Any]) -> Set[str]:
    fields = set(filter(None, mapper.get("fields", {}).values()))
    data_fields = set(filter(None, mapper.get("data", {}).values()))
    return {path.split(".")[0] for path in fields | data_fields}


def detect(sample: Dict[str, Any]) -> Dict[str, Any]:
    """Detect schema drift for a sample connector payload."""

    source = sample.get("source")
    if not source:
        raise ValueError("Sample payload missing 'source'")
    payload = sample.get("payload")
    if not isinstance(payload, dict):
        raise ValueError("Sample payload must be a dictionary")

    mapper = sample.get("mapper_override") or _load_mapper(source)
    mapper_keys = _paths_from_mapping(mapper)
    payload_keys = set(payload)

    missing = sorted(mapper_keys - payload_keys)
    unexpected = sorted(payload_keys - mapper_keys)

    return {
        "source": source,
        "mapper": f"{source}_to_bus.json",
        "drift": bool(missing or unexpected),
        "missing_fields": missing,
        "unexpected_fields": unexpected,
    }


__all__ = ["detect"]
