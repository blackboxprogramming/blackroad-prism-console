"""Utilities to run jobs on remote Jetson devices."""
from __future__ import annotations

import subprocess


def run_remote(host: str, command: str, user: str = "jetson") -> None:
    """Run an arbitrary command on the Jetson via SSH."""
    full_host = f"{user}@{host}"
    try:
        subprocess.run(["ssh", "-t", full_host, command], check=True)
    except subprocess.CalledProcessError as exc:
        print(f"[BlackRoad] Job failed with exit {exc.returncode}")
