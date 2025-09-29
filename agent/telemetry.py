"""Telemetry collection utilities for local hosts and remote Jetson devices."""
from __future__ import annotations

import shlex
import subprocess
from typing import Dict


def _run(cmd: str) -> str:
    """Run a shell command and return its stripped output or ``"n/a"`` on failure."""
    try:
        return subprocess.check_output(shlex.split(cmd), text=True).strip()
    except Exception:
        return "n/a"


def collect_local() -> Dict[str, str]:
    """Collect telemetry from the local machine (e.g. Raspberry Pi)."""
    return {
        "uptime": _run("uptime -p"),
        "temp": _run("vcgencmd measure_temp"),
        "load": _run("uptime | awk -F'load average:' '{print $2}'"),
    }


def collect_remote(host: str, user: str = "jetson") -> Dict[str, str]:
    """Collect telemetry from a remote Jetson device over SSH."""

    base = f"{user}@{host}"

    def ssh(cmd: str) -> str:
        try:
            return subprocess.check_output(
                ["ssh", "-o", "ConnectTimeout=3", base, cmd],
                text=True,
            ).strip()
        except Exception:
            return "n/a"

    return {
        "uptime": ssh("uptime -p"),
        "load": ssh("uptime | awk -F'load average:' '{print $2}'"),
        "tegrastats": ssh("tegrastats --interval 1000 --count 1 || echo 'no tegrastats'"),
    }
