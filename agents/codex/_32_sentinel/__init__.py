"""Python package shim exposing the Codex-32 Sentinel assets."""

from __future__ import annotations

from pathlib import Path
from typing import List

_BASE_DIR = Path(__file__).resolve().parent.parent / "32-sentinel"
__path__: List[str] = [str(_BASE_DIR)]
