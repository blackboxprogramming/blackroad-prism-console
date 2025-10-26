"""Python package shim exposing the Codex-26 assets."""

from __future__ import annotations

from pathlib import Path
from typing import List

_BASE_DIR = Path(__file__).resolve().parent.parent / "26-linguist"
__path__: List[str] = [str(_BASE_DIR)]
