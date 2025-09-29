"""Local wrapper for whisper.cpp transcription."""

from __future__ import annotations

import pathlib
import shutil
import subprocess
import tempfile


def run_whisper(audio_path: str, model_path: str | None = None, lang: str = "en") -> str:
    """Run whisper.cpp binary against the provided audio file."""
    exe = shutil.which("whisper") or shutil.which("main")  # adjust to your whisper.cpp binary
    if not exe:
        return "[error] whisper.cpp binary not found"

    audio_file = pathlib.Path(audio_path).expanduser()
    if not audio_file.exists():
        return "[error] audio file not found"

    model_path = model_path or "/var/lib/blackroad/models/ggml-base.en.bin"
    cmd = [exe, "-m", model_path, "-l", lang, str(audio_file)]

    try:
        out = subprocess.check_output(
            cmd,
            text=True,
            stderr=subprocess.STDOUT,
            cwd=tempfile.gettempdir(),
        )
        return out
    except subprocess.CalledProcessError as exc:  # pragma: no cover - passthrough error text
        return f"[error] {exc.output}"
