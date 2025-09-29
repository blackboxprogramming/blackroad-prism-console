"""Helpers for discovering and streaming local llama.cpp models."""

from __future__ import annotations

import subprocess
import shutil
from pathlib import Path
from typing import Generator

MODEL_DIRECTORIES: tuple[Path, ...] = (
    Path("/var/lib/blackroad/models"),
    Path("/opt/blackroad/models"),
    Path("./models"),
)


def list_local_models() -> list[dict[str, str]]:
    """Return discovered GGUF models.

    Searches the known model directories and returns a list of dictionaries with
    ``name`` (for display) and ``path`` (absolute path used when invoking
    ``llama.cpp``).
    """

    models: list[dict[str, str]] = []
    seen: set[Path] = set()
    for base in MODEL_DIRECTORIES:
        if not base.is_dir():
            continue
        for entry in sorted(base.glob("*.gguf")):
            try:
                resolved = entry.resolve(strict=True)
            except FileNotFoundError:
                continue
            if resolved in seen:
                continue
            seen.add(resolved)
            models.append({
                "name": entry.stem,
                "path": str(resolved),
            })
    return models


def run_llama_stream(model_path: str, prompt: str, n_predict: int = 128) -> Generator[str, None, None]:
    """Yield llama.cpp output in streaming mode.

    Parameters
    ----------
    model_path:
        Full path to the GGUF model file.
    prompt:
        Prompt text to feed into the model.
    n_predict:
        Maximum number of tokens to generate.
    """

    if not model_path:
        yield "[error] model path missing"
        return

    model_file = Path(model_path)
    if not model_file.exists():
        yield f"[error] model not found: {model_path}"
        return

    exe = shutil.which("llama") or shutil.which("main")
    if not exe:
        yield "[error] llama.cpp binary not found"
        return

    cmd = [exe, "-m", str(model_file), "-p", prompt, "-n", str(n_predict)]

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except OSError as exc:
        yield f"[error] failed to start llama.cpp: {exc}"
        return

    return_code: int | None = None
    try:
        assert proc.stdout is not None
        for line in proc.stdout:
            yield line.rstrip("\n")
    except Exception as exc:  # pragma: no cover - defensive; streaming loop
        yield f"[error] runtime failure: {exc}"
        proc.kill()
    finally:
        if proc.stdout:
            proc.stdout.close()
        return_code = proc.wait()

    if return_code not in (0, None):
        yield f"[error] llama.cpp exited with code {return_code}"
