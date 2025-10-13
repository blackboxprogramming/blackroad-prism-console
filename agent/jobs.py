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
