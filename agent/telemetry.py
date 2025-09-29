"""Utility helpers for collecting local and remote telemetry data."""
from __future__ import annotations

import json
import os
import subprocess
import textwrap
from pathlib import Path
from typing import Any, Dict, Optional

REMOTE_TIMEOUT_SECONDS = 15
THERMAL_PATHS = (
    "/sys/class/thermal/thermal_zone0/temp",
    "/sys/devices/virtual/thermal/thermal_zone0/temp",
    "/sys/class/hwmon/hwmon0/temp1_input",
)


def _read_load() -> Optional[Dict[str, float]]:
    try:
        load1, load5, load15 = os.getloadavg()
    except OSError:
        return None
    return {"1m": load1, "5m": load5, "15m": load15}


def _parse_meminfo() -> Optional[Dict[str, float]]:
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError:
        return None

    stats: Dict[str, int] = {}
    for line in lines:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        parts = value.strip().split()
        if not parts:
            continue
        try:
            stats[key.strip()] = int(parts[0])
        except ValueError:
            continue

    total = stats.get("MemTotal")
    available = stats.get("MemAvailable")
    free = stats.get("MemFree")

    if total is None:
        return None

    mem: Dict[str, float] = {"total_mb": total / 1024}
    if available is not None:
        mem["available_mb"] = available / 1024
    if free is not None:
        mem["free_mb"] = free / 1024
    return mem


def _read_uptime() -> Optional[float]:
    try:
        with open("/proc/uptime", "r", encoding="utf-8") as fh:
            content = fh.read().strip().split()
    except OSError:
        return None

    if not content:
        return None

    try:
        return float(content[0])
    except ValueError:
        return None


def _read_temperature() -> Optional[float]:
    for path in THERMAL_PATHS:
        try:
            raw = Path(path).read_text(encoding="utf-8").strip()
        except OSError:
            continue

        if not raw:
            continue

        try:
            value = float(raw)
        except ValueError:
            continue

        if value > 1000:
            value /= 1000.0
        return value
    return None


def _build_payload() -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "host": os.uname().nodename if hasattr(os, "uname") else None,
        "load": _read_load(),
        "memory": _parse_meminfo(),
        "uptime_s": _read_uptime(),
        "temp_c": _read_temperature(),
    }
    return payload


def collect_local() -> Dict[str, Any]:
    """Collect telemetry from the local machine."""
    return _build_payload()


_REMOTE_SCRIPT = textwrap.dedent(
    """
    import json
    import os
    from pathlib import Path


    THERMAL_PATHS = (
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/devices/virtual/thermal/thermal_zone0/temp",
        "/sys/class/hwmon/hwmon0/temp1_input",
    )


    def read_load():
        try:
            load1, load5, load15 = os.getloadavg()
        except OSError:
            return None
        return {"1m": load1, "5m": load5, "15m": load15}


    def parse_meminfo():
        try:
            with open("/proc/meminfo", "r", encoding="utf-8") as fh:
                lines = fh.readlines()
        except OSError:
            return None

        stats = {}
        for line in lines:
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            parts = value.strip().split()
            if not parts:
                continue
            try:
                stats[key.strip()] = int(parts[0])
            except ValueError:
                continue

        total = stats.get("MemTotal")
        available = stats.get("MemAvailable")
        free = stats.get("MemFree")

        if total is None:
            return None

        mem = {"total_mb": total / 1024}
        if available is not None:
            mem["available_mb"] = available / 1024
        if free is not None:
            mem["free_mb"] = free / 1024
        return mem


    def read_uptime():
        try:
            with open("/proc/uptime", "r", encoding="utf-8") as fh:
                content = fh.read().strip().split()
        except OSError:
            return None
        if not content:
            return None
        try:
            return float(content[0])
        except ValueError:
            return None


    def read_temperature():
        for path in THERMAL_PATHS:
            try:
                raw = Path(path).read_text(encoding="utf-8").strip()
            except OSError:
                continue
            if not raw:
                continue
            try:
                value = float(raw)
            except ValueError:
                continue
            if value > 1000:
                value /= 1000.0
            return value
        return None


    payload = {
        "host": os.uname().nodename if hasattr(os, "uname") else None,
        "load": read_load(),
        "memory": parse_meminfo(),
        "uptime_s": read_uptime(),
        "temp_c": read_temperature(),
    }

    print(json.dumps(payload))
    """
)


def collect_remote(host: str, user: Optional[str] = None) -> Dict[str, Any]:
    """Collect telemetry from a remote host via SSH."""
    remote = f"{user}@{host}" if user else host
    try:
        proc = subprocess.run(
            ["ssh", remote, "python3", "-"],
            input=_REMOTE_SCRIPT,
            capture_output=True,
            text=True,
            timeout=REMOTE_TIMEOUT_SECONDS,
            check=True,
        )
    except FileNotFoundError:
        return {"error": "ssh executable not found"}
    except subprocess.TimeoutExpired:
        return {"error": f"timeout collecting telemetry from {remote}"}
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip() if exc.stderr else str(exc)
        return {"error": f"ssh failed: {stderr}"}

    output = proc.stdout.strip()
    if not output:
        return {"error": "no telemetry returned"}

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"error": "invalid telemetry payload", "raw": output}


__all__ = ["collect_local", "collect_remote"]
