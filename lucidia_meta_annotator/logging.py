"""Structured JSON logging for audit trails."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict


def log_event(path: str | Path, event: Dict[str, Any]) -> None:
    """Append *event* as a JSON line to *path*."""
    p = Path(path)
    line = json.dumps(event, sort_keys=True)
    with p.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")
