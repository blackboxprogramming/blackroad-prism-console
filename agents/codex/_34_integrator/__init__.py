"""Python accessors for Codex-34 assets."""
from __future__ import annotations

import sys
from pathlib import Path

_BASE = Path(__file__).resolve().parent.parent / "34-integrator"
if str(_BASE) not in sys.path:
    sys.path.insert(0, str(_BASE))

__all__ = ["_BASE"]
