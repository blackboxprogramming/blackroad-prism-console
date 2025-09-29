"""Helpers for executing shell jobs and streaming their output."""

from __future__ import annotations

import subprocess
from typing import Iterable


def _prepare_command(command: str) -> str:
    if not command:
        raise ValueError("command must be non-empty")
    return command


def run_remote_stream(command: str) -> Iterable[str]:
    """Run *command* locally and yield stdout/stderr lines as they arrive."""

    cmd = _prepare_command(command)
    proc = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        executable="/bin/bash",
    )

    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            yield line.rstrip("\n")
        return_code = proc.wait()
        if return_code != 0:
            raise RuntimeError(f"command exited with code {return_code}")
    finally:
        try:
            proc.stdout.close()
        except Exception:
            pass
        if proc.poll() is None:
            proc.kill()
