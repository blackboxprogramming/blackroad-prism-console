"""Local file management for transcription uploads."""
from __future__ import annotations

import os
from pathlib import Path

_DEFAULT_TMP = Path(os.getenv("BLACKROAD_TRANSCRIBE_TMP", "/tmp/blackroad_transcribe"))
TMP_DIR = _DEFAULT_TMP
TMP_DIR.mkdir(parents=True, exist_ok=True)

__all__ = ["TMP_DIR"]
