"""Utilities to list and trigger jobs on the Jetson host."""

from __future__ import annotations

import shlex
import subprocess
from typing import Callable, Mapping, MutableSequence, Sequence

from .config import resolve_target

SSHRunner = Callable[[Sequence[str]], subprocess.CompletedProcess[str]]


def _default_runner(cmd: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # type: ignore[arg-type]
        cmd,
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    )


def _parse_jobs(output: str) -> MutableSequence[Mapping[str, str]]:
    jobs: MutableSequence[Mapping[str, str]] = []
    for line in output.splitlines():
        parts = line.split()
        if len(parts) < 4:
            continue
        job_id, job_type, state = parts[:3]
        unit = " ".join(parts[3:])
        jobs.append({
            "id": job_id,
            "type": job_type,
            "state": state,
            "unit": unit,
        })
    return jobs


def list_jobs(host: str | None = None, user: str | None = None, runner: SSHRunner | None = None) -> Mapping[str, object]:
    """Return active ``systemd`` jobs on the Jetson.

    The function respects ``JETSON_HOST`` / ``JETSON_USER`` and can be supplied
    with a custom ``runner`` to facilitate testing.
    """

    resolved_host, resolved_user = resolve_target(host, user)
    runner = runner or _default_runner
    cmd = [
        "ssh",
        f"{resolved_user}@{resolved_host}",
        "systemctl list-jobs --all --no-legend",
    ]
    result = runner(cmd)
    output = result.stdout.strip()

    if result.returncode != 0:
        return {
            "ok": False,
            "host": resolved_host,
            "user": resolved_user,
            "error": result.stderr.strip() or "systemctl list-jobs failed",
        }

    return {
        "ok": True,
        "host": resolved_host,
        "user": resolved_user,
        "jobs": list(_parse_jobs(output)),
    }


def trigger(service: str, host: str | None = None, user: str | None = None, runner: SSHRunner | None = None) -> Mapping[str, object]:
    """Restart a ``systemd`` unit on the Jetson and report the outcome."""

    if not service:
        raise ValueError("service name required")

    resolved_host, resolved_user = resolve_target(host, user)
    runner = runner or _default_runner
    cmd = [
        "ssh",
        f"{resolved_user}@{resolved_host}",
        f"sudo systemctl restart {shlex.quote(service)}",
    ]
    result = runner(cmd)
    error = result.stderr.strip()

    return {
        "ok": result.returncode == 0,
        "host": resolved_host,
        "user": resolved_user,
        "service": service,
        "error": error if error else None,
    }


__all__ = ["list_jobs", "trigger"]
