"""Telemetry helpers for the BlackRoad device agent."""

from __future__ import annotations

import json
import os
import platform
import shutil
import socket
import subprocess
from dataclasses import dataclass
from typing import Any, Mapping, Optional

DEFAULT_DISK_PATH = "/"
THERMAL_PATHS = (
    "/sys/class/thermal/thermal_zone0/temp",
    "/sys/class/thermal/thermal_zone1/temp",
)


@dataclass(frozen=True)
class TelemetrySnapshot:
    """Structured telemetry metrics."""

    hostname: str
    load_1m: Optional[float]
    load_5m: Optional[float]
    load_15m: Optional[float]
    uptime_seconds: Optional[float]
    mem_total_kb: Optional[int]
    mem_available_kb: Optional[int]
    disk_total_gb: Optional[float]
    disk_free_gb: Optional[float]
    cpu_temp_c: Optional[float]

    def as_dict(self) -> dict[str, Any]:
        return {
            "hostname": self.hostname,
            "load_1m": self.load_1m,
            "load_5m": self.load_5m,
            "load_15m": self.load_15m,
            "uptime_seconds": self.uptime_seconds,
            "mem_total_kb": self.mem_total_kb,
            "mem_available_kb": self.mem_available_kb,
            "disk_total_gb": self.disk_total_gb,
            "disk_free_gb": self.disk_free_gb,
            "cpu_temp_c": self.cpu_temp_c,
        }


def _read_loadavg() -> tuple[Optional[float], Optional[float], Optional[float]]:
    try:
        return os.getloadavg()
    except OSError:
        return (None, None, None)


def _read_uptime() -> Optional[float]:
    try:
        with open("/proc/uptime", "r", encoding="utf-8") as fh:
            return float(fh.read().split()[0])
    except (OSError, ValueError, IndexError):
        return None


def _read_meminfo() -> Mapping[str, int]:
    info: dict[str, int] = {}
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as fh:
            for line in fh:
                parts = line.split()
                if len(parts) >= 2:
                    key = parts[0].rstrip(":")
                    try:
                        info[key] = int(parts[1])
                    except ValueError:
                        continue
    except OSError:
        return {}
    return info


def _read_disk_usage(path: str = DEFAULT_DISK_PATH) -> tuple[Optional[float], Optional[float]]:
    try:
        usage = shutil.disk_usage(path)
    except OSError:
        return (None, None)
    total_gb = round(usage.total / (1024**3), 2)
    free_gb = round(usage.free / (1024**3), 2)
    return (total_gb, free_gb)


def _read_temperature() -> Optional[float]:
    for candidate in THERMAL_PATHS:
        try:
            with open(candidate, "r", encoding="utf-8") as fh:
                raw = fh.read().strip()
        except OSError:
            continue
        try:
            value = float(raw) / 1000.0 if len(raw) > 3 else float(raw)
        except ValueError:
            continue
        return round(value, 2)
    return None


def collect_local() -> dict[str, Any]:
    hostname = platform.node() or socket.gethostname()
    load_1m, load_5m, load_15m = _read_loadavg()
    uptime_seconds = _read_uptime()
    meminfo = _read_meminfo()
    disk_total_gb, disk_free_gb = _read_disk_usage()
    cpu_temp_c = _read_temperature()

    snapshot = TelemetrySnapshot(
        hostname=hostname,
        load_1m=load_1m,
        load_5m=load_5m,
        load_15m=load_15m,
        uptime_seconds=uptime_seconds,
        mem_total_kb=meminfo.get("MemTotal"),
        mem_available_kb=meminfo.get("MemAvailable"),
        disk_total_gb=disk_total_gb,
        disk_free_gb=disk_free_gb,
        cpu_temp_c=cpu_temp_c,
    )
    return snapshot.as_dict()


REMOTE_COLLECT_SCRIPT = """python3 - <<'PY'
import json
import os
import platform
import shutil
import socket

THERMAL_PATHS = (
    "/sys/class/thermal/thermal_zone0/temp",
    "/sys/class/thermal/thermal_zone1/temp",
)


def read_loadavg():
    try:
        return os.getloadavg()
    except OSError:
        return (None, None, None)


def read_uptime():
    try:
        with open("/proc/uptime", "r", encoding="utf-8") as fh:
            return float(fh.read().split()[0])
    except (OSError, ValueError, IndexError):
        return None


def read_meminfo():
    info = {}
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as fh:
            for line in fh:
                parts = line.split()
                if len(parts) >= 2:
                    key = parts[0].rstrip(":")
                    try:
                        info[key] = int(parts[1])
                    except ValueError:
                        continue
    except OSError:
        return {}
    return info


def read_disk_usage(path="/"):
    try:
        usage = shutil.disk_usage(path)
    except OSError:
        return (None, None)
    total_gb = round(usage.total / (1024**3), 2)
    free_gb = round(usage.free / (1024**3), 2)
    return (total_gb, free_gb)


def read_temperature():
    for candidate in THERMAL_PATHS:
        try:
            with open(candidate, "r", encoding="utf-8") as fh:
                raw = fh.read().strip()
        except OSError:
            continue
        try:
            value = float(raw) / 1000.0 if len(raw) > 3 else float(raw)
        except ValueError:
            continue
        return round(value, 2)
    return None


def collect():
    load_1m, load_5m, load_15m = read_loadavg()
    meminfo = read_meminfo()
    disk_total_gb, disk_free_gb = read_disk_usage()
    payload = {
        "hostname": platform.node() or socket.gethostname(),
        "load_1m": load_1m,
        "load_5m": load_5m,
        "load_15m": load_15m,
        "uptime_seconds": read_uptime(),
        "mem_total_kb": meminfo.get("MemTotal"),
        "mem_available_kb": meminfo.get("MemAvailable"),
        "disk_total_gb": disk_total_gb,
        "disk_free_gb": disk_free_gb,
        "cpu_temp_c": read_temperature(),
    }
    print(json.dumps(payload))


collect()
PY"""


def collect_remote(host: str, *, user: Optional[str] = None, timeout: int = 15) -> dict[str, Any]:
    target = f"{user}@{host}" if user else host
    try:
        result = subprocess.run(
            [
                "ssh",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=5",
                target,
                REMOTE_COLLECT_SCRIPT,
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError:
        return {"error": "ssh_not_found", "host": host, "user": user}
    except subprocess.TimeoutExpired:
        return {"error": "ssh_timeout", "host": host, "user": user}

    if result.returncode != 0:
        return {
            "error": "ssh_failed",
            "host": host,
            "user": user,
            "stderr": result.stderr.strip(),
        }

    stdout = result.stdout.strip()
    if not stdout:
        return {"error": "no_data", "host": host, "user": user}

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return {
            "error": "invalid_json",
            "host": host,
            "user": user,
            "raw": stdout,
        }
