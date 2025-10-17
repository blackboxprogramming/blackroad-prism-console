"""Job execution helpers for the BlackRoad API service."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Any, Dict, Optional


class JobError(RuntimeError):
    """Raised when a job cannot be executed."""


@dataclass(slots=True)
class JobResult:
    """Container for remote job execution results."""

    host: str
    command: str
    returncode: int
    stdout: str
    stderr: str

    @property
    def status(self) -> str:
        return "ok" if self.returncode == 0 else "error"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "host": self.host,
            "command": self.command,
            "returncode": self.returncode,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "status": self.status,
        }


def run_remote(
    host: str,
    command: str,
    *,
    user: Optional[str] = None,
    timeout: int = 60,
) -> Dict[str, Any]:
    """Execute a command on a remote host via SSH."""
    if not command or not command.strip():
        raise JobError("Command must not be empty")

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
                "bash",
                "-lc",
                command,
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError as exc:  # pragma: no cover - environment guard
        raise JobError("ssh executable not found") from exc
    except subprocess.TimeoutExpired as exc:
        raise JobError(f"Timed out running command on {target}") from exc

    result = JobResult(
        host=target,
        command=command,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )

    payload = result.to_dict()
    if result.returncode != 0:
        payload["error"] = f"Command exited with status {result.returncode}"

    return payload


__all__ = ["run_remote", "JobError", "JobResult"]
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
"""Remote job helpers for the Jetson runner."""

from __future__ import annotations

import shlex
import subprocess
from typing import Dict, Optional

from . import _host_user


def start_remote_logged(jid: int, command: str, host: str | None = None, user: str | None = None) -> Dict[str, str]:
    """Launch ``command`` on the remote host and capture output to a log file."""

    host, user = _host_user(host, user)
    log = f"/tmp/blackroad_job_{jid}.log"
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    exitf = f"/tmp/blackroad_job_{jid}.exit"
    inner = f"( exec setsid bash -lc '{command}'; echo $? > {shlex.quote(exitf)} )"
    remote = (
        "bash -lc 'set -m; "
        f"rm -f {shlex.quote(log)} {shlex.quote(pidf)} {shlex.quote(exitf)}; "
        f"nohup bash -lc {shlex.quote(inner)} "
        f"> {shlex.quote(log)} 2>&1 & echo $! > {shlex.quote(pidf)}; "
        f"disown; sleep 0.2; cat {shlex.quote(pidf)}'"
    )
    pid = subprocess.check_output(["ssh", f"{user}@{host}", remote], text=True).strip()
    return {"pid": int(pid), "log": log, "pidfile": pidf, "exitfile": exitf}


def remote_exit_code(jid: int, host: str | None = None, user: str | None = None) -> Optional[int]:
    """Fetch the exit code for ``jid`` from the remote sidecar file."""

    host, user = _host_user(host, user)
    exitf = f"/tmp/blackroad_job_{jid}.exit"
    try:
        out = subprocess.check_output(
            [
                "ssh",
                f"{user}@{host}",
                "bash",
                "-lc",
                f"cat {shlex.quote(exitf)} 2>/dev/null || true",
            ],
            text=True,
        ).strip()
        return int(out) if out != "" else None
    except Exception:
        return None
