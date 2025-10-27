"""Normalization pipeline for Codex-34 events."""
from __future__ import annotations

from datetime import datetime, timezone
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, Optional
from uuid import uuid4

_ROOT = Path(__file__).resolve().parent.parent
_CONTRACTS = _ROOT / "contracts"
_MAPPERS = _ROOT / "mappers"


class NormalizationError(RuntimeError):
    """Raised when a payload cannot be normalized."""


@lru_cache(maxsize=32)
def _load_mapper(source: str) -> Dict[str, Any]:
    path = _MAPPERS / f"{source}_to_bus.json"
    if not path.exists():
        raise NormalizationError(f"No mapper defined for source '{source}'")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _extract(payload: Dict[str, Any], path: Optional[str]) -> Any:
    if not path:
        return None
    value: Any = payload
    for part in path.split("."):
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return None
    return value


def _ensure_iso_timestamp(raw: Optional[str]) -> str:
    if raw and raw != "__NOW__":
        return raw
    return datetime.now(timezone.utc).isoformat()


def _ensure_list(value: Any) -> Iterable[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return [str(item) for item in value]
    return [str(value)]


def normalize(event: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a connector event using the configured mapper."""

    if "source" not in event:
        raise NormalizationError("Missing 'source' in event")

    payload = event.get("payload", {})
    if not isinstance(payload, dict):
        raise NormalizationError("Event payload must be a dictionary")

    source = event["source"]
    mapper = event.get("mapper_override") or _load_mapper(source)

    mapper_fields = mapper.get("fields", {})
    mapper_data = mapper.get("data", {})
    mapper_defaults = mapper.get("defaults", {})

    identifier = _extract(payload, mapper_fields.get("id")) or str(uuid4())
    event_type = (
        _extract(payload, mapper_fields.get("type"))
        or mapper_defaults.get("type")
        or "event"
    )
    timestamp_raw = _extract(payload, mapper_fields.get("timestamp"))
    timestamp = _ensure_iso_timestamp(timestamp_raw)

    data: Dict[str, Any] = {}
    for key, path in mapper_data.items():
        value = _extract(payload, path)
        if value is not None:
            data[key] = value

    metadata = dict(event.get("metadata", {}))
    mapper_metadata = mapper.get("metadata", {})
    if mapper_metadata:
        for key, value in mapper_metadata.items():
            if key == "consent_scope":
                metadata[key] = list(_ensure_list(value))
            else:
                metadata[key] = value
    metadata.setdefault("consent_scope", list(_ensure_list(metadata.get("consent_scope"))))
    metadata["mapper_version"] = mapper.get("version", "unknown")

    normalized = {
        "id": identifier,
        "source": source,
        "type": str(event_type),
        "timestamp": timestamp,
        "data": data,
        "metadata": metadata,
    }

    if "replay" in event:
        normalized["replay"] = bool(event["replay"])

    _validate(normalized)
    return normalized


def _validate(event: Dict[str, Any]) -> None:
    required = {
        "id": str,
        "source": str,
        "type": str,
        "timestamp": str,
        "data": dict,
        "metadata": dict,
    }
    for key, expected in required.items():
        if key not in event:
            raise NormalizationError(f"Normalized event missing '{key}'")
        if not isinstance(event[key], expected):
            raise NormalizationError(
                f"Normalized event field '{key}' must be {expected.__name__}"
            )
    if not event["id"]:
        raise NormalizationError("Normalized event id must not be empty")

    metadata = event["metadata"]
    if "consent_scope" in metadata:
        if not isinstance(metadata["consent_scope"], list):
            raise NormalizationError("consent_scope must be a list")
        metadata["consent_scope"] = [str(scope) for scope in metadata["consent_scope"]]
    else:
        metadata["consent_scope"] = []


__all__ = ["normalize", "NormalizationError"]
