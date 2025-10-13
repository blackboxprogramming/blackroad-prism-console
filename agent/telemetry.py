"""Telemetry helpers for the BlackRoad API service."""

from __future__ import annotations

import json
import os
import platform
import shutil
import socket
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict


class TelemetryError(RuntimeError):
    """Raised when telemetry information cannot be collected."""


@dataclass(slots=True)
class TelemetryResult:
    """Structured telemetry payload returned by collectors."""

    status: str
    payload: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        data = {"status": self.status, **self.payload}
        return data


def _load_average() -> list[float] | None:
    try:
        one, five, fifteen = os.getloadavg()
        return [float(one), float(five), float(fifteen)]
    except (AttributeError, OSError):
        return None


def _memory_info() -> Dict[str, Any]:
    info: Dict[str, Any] = {}
    try:
        with open("/proc/meminfo", encoding="utf-8") as handle:
            for line in handle:
                if ":" not in line:
                    continue
                key, value = line.split(":", 1)
                info[key.strip()] = value.strip()
    except (FileNotFoundError, OSError):
        # /proc/meminfo is not available on all systems; fall back to an empty payload.
        return info
    return info


def _disk_usage(path: str = "/") -> Dict[str, int] | None:
    try:
        usage = shutil.disk_usage(path)
    except (FileNotFoundError, OSError):
        return None
    return {"total": usage.total, "used": usage.used, "free": usage.free}


def _base_payload() -> Dict[str, Any]:
    timestamp = time.time()
    return {
        "hostname": socket.gethostname(),
        "platform": platform.platform(),
        "timestamp": timestamp,
        "iso_timestamp": datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z"),
        "load_average": _load_average(),
        "memory": _memory_info(),
        "disk": _disk_usage(),
    }


def collect_local() -> Dict[str, Any]:
    """Collect telemetry for the local host."""
    try:
        result = TelemetryResult(status="ok", payload=_base_payload())
    except Exception as exc:  # pragma: no cover - defensive guard
        raise TelemetryError("Failed to collect local telemetry") from exc
    return result.to_dict()


_REMOTE_SNIPPET = " ".join(
    line.strip()
    for line in (
        "import json, os, platform, shutil, socket, time",
        "from datetime import datetime",
        "def load_average():",
        "    try:",
        "        return list(os.getloadavg())",
        "    except (OSError, AttributeError):",
        "        return None",
        "def memory_info():",
        "    info = {}",
        "    try:",
        "        with open('/proc/meminfo', encoding='utf-8') as handle:",
        "            for line in handle:",
        "                if ':' not in line:",
        "                    continue",
        "                key, value = line.split(':', 1)",
        "                info[key.strip()] = value.strip()",
        "    except (FileNotFoundError, OSError):",
        "        pass",
        "    return info",
        "def disk_usage(path='/'):",
        "    try:",
        "        usage = shutil.disk_usage(path)",
        "    except (FileNotFoundError, OSError):",
        "        return None",
        "    return {'total': usage.total, 'used': usage.used, 'free': usage.free}",
        "timestamp = time.time()",
        "payload = {",
        "    'hostname': socket.gethostname(),",
        "    'platform': platform.platform(),",
        "    'timestamp': timestamp,",
        "    'iso_timestamp': datetime.utcfromtimestamp(timestamp).isoformat() + 'Z',",
        "    'load_average': load_average(),",
        "    'memory': memory_info(),",
        "    'disk': disk_usage(),",
        "}",
        "print(json.dumps({'status': 'ok', **payload}))",
    )
)


def collect_remote(host: str, *, user: str | None = None, timeout: int = 10) -> Dict[str, Any]:
    """Collect telemetry from a remote host via SSH."""
    target = f"{user}@{host}" if user else host
    try:
        completed = subprocess.run(
            [
                "ssh",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=5",
                target,
                "python3",
                "-c",
                _REMOTE_SNIPPET,
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError as exc:  # pragma: no cover - environment guard
        raise TelemetryError("ssh executable not found") from exc
    except subprocess.TimeoutExpired as exc:
        raise TelemetryError(f"Timed out collecting telemetry from {target}") from exc
    except subprocess.CalledProcessError as exc:
        stderr = (exc.stderr or "").strip()
        message = stderr or f"Failed to collect telemetry from {target}"
        raise TelemetryError(message) from exc

    output = completed.stdout.strip()
    if not output:
        raise TelemetryError(f"No telemetry returned from {target}")

    try:
        data = json.loads(output)
    except json.JSONDecodeError as exc:
        raise TelemetryError(f"Invalid telemetry payload from {target}") from exc

    if not isinstance(data, dict):
        raise TelemetryError(f"Unexpected telemetry format from {target}")

    return data


__all__ = ["collect_local", "collect_remote", "TelemetryError", "TelemetryResult"]
