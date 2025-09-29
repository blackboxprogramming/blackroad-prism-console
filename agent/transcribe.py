"""Helpers for handling Whisper streaming transcription."""

from __future__ import annotations

import pathlib
import shutil
import subprocess
import tempfile
from typing import Iterable

TMP_DIR = pathlib.Path("/tmp/blackroad_whisper")
TMP_DIR.mkdir(parents=True, exist_ok=True)


def save_upload(data: bytes, suffix: str = ".wav") -> str:
    """Persist uploaded ``data`` to a temporary file and return its path."""

    with tempfile.NamedTemporaryFile(delete=False, dir=TMP_DIR, suffix=suffix) as handle:
        handle.write(data)
        return handle.name


def run_whisper_stream(
    audio_path: str,
    *,
    model_path: str | None = None,
    lang: str = "en",
) -> Iterable[str]:
    """Invoke ``whisper.cpp`` and yield decoded lines as they stream."""

    exe = shutil.which("whisper") or shutil.which("main")
    if not exe:
        yield "[error] whisper.cpp binary not found"
        return

    resolved_model = model_path or "/var/lib/blackroad/models/ggml-base.en.bin"
    cmd = [exe, "-m", resolved_model, "-l", lang, audio_path]

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    try:
        if proc.stdout is None:
            yield "[error] failed to capture whisper output"
            return

        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        if proc.stdout is not None:
            proc.stdout.close()
        proc.wait()
