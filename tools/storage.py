from __future__ import annotations

import json
from pathlib import Path

from config.settings import settings


def _ensure_parent(path: Path) -> None:
    if settings.READ_ONLY:
        return
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    _ensure_parent(path)
    if settings.READ_ONLY:
        return
    with path.open("w", encoding="utf-8") as fh:
        fh.write(content)


def append_text(path: Path, content: str) -> None:
    _ensure_parent(path)
    if settings.READ_ONLY:
        return
    with path.open("a", encoding="utf-8") as fh:
        fh.write(content)


def write_json(path: Path, data: dict) -> None:
    write_text(path, json.dumps(data, indent=2))
