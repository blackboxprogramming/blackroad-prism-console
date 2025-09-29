"""Utilities for running remote jobs on Jetson hosts."""

from __future__ import annotations

import subprocess
from typing import Iterator


def run_remote(host: str, command: str, user: str = "jetson") -> None:
    """Execute a remote command over SSH and wait for completion."""
    full = ["ssh", "-t", f"{user}@{host}", command]
    subprocess.run(full, check=True)


def run_remote_stream(host: str, command: str, user: str = "jetson") -> Iterator[str]:
    """Yield stdout lines live from a remote command over SSH."""
    full = ["ssh", f"{user}@{host}", command]
    proc = subprocess.Popen(
        full,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    try:
        if proc.stdout is None:
            return
        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        if proc.stdout is not None:
            proc.stdout.close()
        proc.wait()
