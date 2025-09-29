"""Helpers for collecting system telemetry for the dashboard."""

from __future__ import annotations

import platform
import shutil
import subprocess
from typing import Any, Dict, Iterable, Mapping, Sequence

DEFAULT_COMMANDS: Mapping[str, Sequence[str]] = {
    "uname": ["uname", "-a"],
    "uptime": ["uptime"],
    "disk": ["df", "-h"],
}


def collect_local(commands: Mapping[str, Sequence[str]] | None = None) -> Dict[str, Any]:
    """Collect telemetry information from the local machine."""

    return _collect(commands or DEFAULT_COMMANDS)


def collect_remote(
    host: str,
    *,
    user: str | None = None,
    commands: Mapping[str, Sequence[str]] | None = None,
) -> Dict[str, Any]:
    """Collect telemetry from a remote host via SSH."""

    if not host:
        raise ValueError("host must be provided")

    return _collect(commands or DEFAULT_COMMANDS, ssh_target=_format_ssh_target(host, user))


def _format_ssh_target(host: str, user: str | None) -> str:
    return f"{user}@{host}" if user else host


def _collect(
    commands: Mapping[str, Sequence[str]],
    *,
    ssh_target: str | None = None,
) -> Dict[str, Any]:
    telemetry: Dict[str, Any] = {
        "hostname": platform.node() if ssh_target is None else ssh_target,
    }

    for label, command in commands.items():
        telemetry[label] = _run_command(command, ssh_target=ssh_target)

    return telemetry


def _run_command(command: Sequence[str], *, ssh_target: str | None = None) -> Dict[str, Any]:
    if ssh_target:
        if shutil.which("ssh") is None:
            return {"error": "ssh executable not found"}
        full_command: Iterable[str] = ("ssh", ssh_target, *command)
    else:
        full_command = command

    try:
        completed = subprocess.run(
            list(full_command),
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except subprocess.CalledProcessError as exc:
        return {"error": exc.stderr.strip() or str(exc)}
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return {"error": str(exc)}

    return {"stdout": completed.stdout.strip()}
