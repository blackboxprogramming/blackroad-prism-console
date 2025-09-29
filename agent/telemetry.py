"""Telemetry helpers for Raspberry Pi and Jetson targets."""
from __future__ import annotations

import os
import shlex
import subprocess
from pathlib import Path
from typing import Dict, Mapping, Sequence

from agent.config import active_target

CommandMap = Mapping[str, Sequence[str] | str]


def _target() -> tuple[str, str]:
    """Return the preferred Jetson target considering environment overrides."""
    env_host = os.getenv("JETSON_HOST")
    env_user = os.getenv("JETSON_USER")
    host, user = active_target()
    if env_host or env_user:
        return env_host or host, env_user or user
    return host, user


def _run_command(cmd: Sequence[str], timeout: int = 10) -> str:
    """Execute a command and return stripped stdout or an error prefix."""
    try:
        out = subprocess.check_output(
            cmd,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
        )
        return out.strip()
    except FileNotFoundError:
        return f"error: command not found: {cmd[0]}"
    except subprocess.TimeoutExpired:
        return "error: timeout"
    except subprocess.CalledProcessError as exc:
        output = exc.output.strip() if exc.output else str(exc)
        return f"error: {output or exc.returncode}"


def _collect(commands: CommandMap) -> Dict[str, str]:
    return {name: _run_command(_ensure_sequence(cmd)) for name, cmd in commands.items()}


def _ensure_sequence(cmd: Sequence[str] | str) -> Sequence[str]:
    if isinstance(cmd, str):
        return shlex.split(cmd)
    return list(cmd)


def _ssh_command(host: str, user: str, command: Sequence[str] | str) -> Sequence[str]:
    if isinstance(command, str):
        remote = ["bash", "-lc", command]
    else:
        remote = list(command)
    return [
        "ssh",
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=5",
        f"{user}@{host}",
        *remote,
    ]


LOCAL_COMMANDS: Dict[str, Sequence[str] | str] = {
    "hostname": ["hostname"],
    "uptime": ["uptime", "-p"],
    "loadavg": ["cat", "/proc/loadavg"],
    "disk_root": ["df", "-h", "/"],
    "memory": ["free", "-m"],
}

REMOTE_COMMANDS: Dict[str, Sequence[str] | str] = {
    "hostname": "hostname",
    "uptime": "uptime -p",
    "loadavg": "cat /proc/loadavg",
    "disk_root": "df -h /",
    "memory": "free -m",
    "gpu": "command -v tegrastats >/dev/null 2>&1 && tegrastats --interval 1000 --count 1 | head -n 1 || echo 'tegrastats unavailable'",
}


def collect_local(extra_commands: CommandMap | None = None) -> Dict[str, str]:
    """Return a dictionary of local telemetry data."""
    commands: Dict[str, Sequence[str] | str] = dict(LOCAL_COMMANDS)
    if extra_commands:
        commands.update(extra_commands)

    results = _collect(commands)

    # Attach CPU temperature if available via sysfs (common on Pi)
    thermal_path = Path("/sys/class/thermal/thermal_zone0/temp")
    if thermal_path.exists():
        try:
            raw = thermal_path.read_text().strip()
            if raw:
                results.setdefault("cpu_temp_c", f"{float(raw) / 1000.0:.1f}")
        except Exception:
            results.setdefault("cpu_temp_c", "error: read failure")
    else:
        temp_result = _run_command(["vcgencmd", "measure_temp"])
        if not temp_result.startswith("error"):
            results.setdefault("cpu_temp", temp_result)
    return results


def collect_remote(
    host: str | None = None,
    user: str | None = None,
    commands: CommandMap | None = None,
) -> Dict[str, str]:
    """Gather telemetry from the remote Jetson via SSH."""
    default_host, default_user = _target()
    host = host or default_host
    user = user or default_user
    command_map: Dict[str, Sequence[str] | str] = dict(REMOTE_COMMANDS)
    if commands:
        command_map.update(commands)

    results: Dict[str, str] = {}
    for name, command in command_map.items():
        ssh_cmd = _ssh_command(host, user, command)
        results[name] = _run_command(ssh_cmd, timeout=20)
    return results


__all__ = [
    "collect_local",
    "collect_remote",
]
