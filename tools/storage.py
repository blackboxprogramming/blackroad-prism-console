from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Iterable, Union

import yaml

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_ROOT = Path(os.environ.get("PRISM_DATA_ROOT", BASE_DIR / "data"))
CONFIG_ROOT = BASE_DIR / "config"
READ_ONLY = os.environ.get("PRISM_READ_ONLY", "0") == "1"


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write(path: str, content: Union[dict, str]) -> None:
    p = Path(path)
    _ensure_parent(p)
    mode = "a" if p.suffix == ".jsonl" else "w"
    text = json.dumps(content) if isinstance(content, dict) else str(content)
    with open(p, mode, encoding="utf-8") as fh:
        if mode == "a":
            fh.write(text + "\n")
        else:
            fh.write(text)


def read(path: str) -> str:
    p = Path(path)
    try:
        with open(p, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return ""


def _resolve(path: str, root: Path) -> Path:
    return root / path


def read_json(path: str, *, from_data: bool = False) -> Any:
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    if not from_data and not target.exists():
        target = BASE_DIR / path
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str, data: Any, *, from_data: bool = True) -> None:
    if READ_ONLY:
        raise RuntimeError("read-only mode")
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    _ensure_parent(target)
    with open(target, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)


def append_jsonl(path: str, record: Any, *, from_data: bool = True) -> None:
    if READ_ONLY:
        raise RuntimeError("read-only mode")
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    _ensure_parent(target)
    with open(target, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")


def read_jsonl(path: str, *, from_data: bool = True) -> Iterable[Any]:
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    if not target.exists():
        return []
    with open(target, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def read_yaml(path: str, *, from_data: bool = False) -> Any:
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    if not from_data and not target.exists():
        target = BASE_DIR / path
    with open(target, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def read_text(path: str, *, from_data: bool = False) -> str:
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    if not from_data and not target.exists():
        target = BASE_DIR / path
    with open(target, "r", encoding="utf-8") as f:
        return f.read()


def write_text(path: str, text: str, *, from_data: bool = False) -> None:
    if READ_ONLY:
        raise RuntimeError("read-only mode")
    root = DATA_ROOT if from_data else CONFIG_ROOT
    target = _resolve(path, root)
    _ensure_parent(target)
    with open(target, "w", encoding="utf-8") as f:
        f.write(text)
"""Stub storage adapter."""


def save(path: str, content: bytes) -> None:
    """Stubbed storage write."""
    raise NotImplementedError("Storage adapter not implemented. TODO: connect to object store")
