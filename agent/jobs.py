"""Helpers for executing jobs on the Jetson target over SSH."""
from __future__ import annotations

import os
import subprocess
from typing import Iterator, Mapping, Sequence

from agent.config import active_target


def _target() -> tuple[str, str]:
    env_host = os.getenv("JETSON_HOST")
    env_user = os.getenv("JETSON_USER")
    host, user = active_target()
    if env_host or env_user:
        return env_host or host, env_user or user
    return host, user


def _resolve(host: str | None, user: str | None) -> tuple[str, str]:
    default_host, default_user = _target()
    return host or default_host, user or default_user


def _ssh_command(host: str, user: str, command: Sequence[str] | str) -> list[str]:
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


def run_remote(
    command: Sequence[str] | str,
    *,
    host: str | None = None,
    user: str | None = None,
    check: bool = False,
    timeout: int | None = None,
    env: Mapping[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    """Run a command on the Jetson via SSH."""
    host, user = _resolve(host, user)
    ssh_cmd = _ssh_command(host, user, command)
    return subprocess.run(
        ssh_cmd,
        check=check,
        text=True,
        capture_output=True,
        timeout=timeout,
        env=env,
    )


def stream_remote(
    command: Sequence[str] | str,
    *,
    host: str | None = None,
    user: str | None = None,
    timeout: int | None = None,
) -> Iterator[str]:
    """Yield lines from a remote command, useful for long-running jobs."""
    host, user = _resolve(host, user)
    ssh_cmd = _ssh_command(host, user, command)
    with subprocess.Popen(
        ssh_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    ) as proc:
        try:
            while True:
                line = proc.stdout.readline()
                if not line:
                    break
                yield line.rstrip("\n")
            proc.wait(timeout=timeout)
        finally:
            if proc.poll() is None:
                proc.terminate()


def copy_to_remote(
    local_path: str,
    remote_path: str,
    *,
    host: str | None = None,
    user: str | None = None,
    recursive: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Copy a local file or directory to the Jetson target using scp."""
    host, user = _resolve(host, user)
    cmd = [
        "scp",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=5",
    ]
    if recursive:
        cmd.append("-r")
    cmd.extend([local_path, f"{user}@{host}:{remote_path}"])
    return subprocess.run(cmd, text=True, capture_output=True)


def copy_from_remote(
    remote_path: str,
    local_path: str,
    *,
    host: str | None = None,
    user: str | None = None,
    recursive: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Copy a remote file or directory from the Jetson target."""
    host, user = _resolve(host, user)
    cmd = [
        "scp",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=5",
    ]
    if recursive:
        cmd.append("-r")
    cmd.extend([f"{user}@{host}:{remote_path}", local_path])
    return subprocess.run(cmd, text=True, capture_output=True)


__all__ = [
    "run_remote",
    "stream_remote",
    "copy_to_remote",
    "copy_from_remote",
]
