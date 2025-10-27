"""Shared utilities for Codex-33 pipelines."""
from __future__ import annotations

import datetime as _dt
import json
from pathlib import Path
from typing import Any, Dict


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_yaml(path: Path) -> Dict[str, Any]:
    """Load a very small subset of YAML for configuration files."""
    try:
        import yaml  # type: ignore

        with path.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle) or {}
    except (ImportError, AttributeError):
        return _fallback_yaml(path)


def _fallback_yaml(path: Path) -> Dict[str, Any]:
    """Parse a subset of YAML that also matches JSON syntax."""
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Cannot parse {path}: install PyYAML for full support") from exc


def timestamp() -> str:
    """Return an ISO-8601 timestamp."""
    return _dt.datetime.utcnow().replace(tzinfo=_dt.timezone.utc).isoformat()
