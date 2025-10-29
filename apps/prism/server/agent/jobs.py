"""Job execution helpers for the Prism console agent."""

from __future__ import annotations

import contextlib
import os
import subprocess
from typing import Iterable, Iterator, List


def _build_ssh_command(command: str) -> List[str]:
    host = os.getenv("BLACKROAD_REMOTE_HOST")
    if not host:
        return []

    user = os.getenv("BLACKROAD_REMOTE_USER")
    port = os.getenv("BLACKROAD_REMOTE_PORT")
    identity = os.getenv("BLACKROAD_REMOTE_IDENTITY")

    dest = f"{user}@{host}" if user else host
    ssh_cmd: List[str] = [
        os.getenv("BLACKROAD_SSH_BIN", "ssh"),
        "-o",
        "BatchMode=yes",
    ]
    if port:
        ssh_cmd.extend(["-p", str(port)])
    if identity:
        ssh_cmd.extend(["-i", identity])
    ssh_cmd.append(dest)

    remote_shell = os.getenv("BLACKROAD_REMOTE_SHELL")
    if remote_shell:
        ssh_cmd.extend([remote_shell, "-lc", command])
    else:
        ssh_cmd.append(command)
    return ssh_cmd


def _build_local_command(command: str) -> List[str]:
    shell = os.getenv("BLACKROAD_LOCAL_SHELL")
    if shell:
        return [shell, "-lc", command]
    return ["/bin/bash", "-lc", command] if os.path.exists("/bin/bash") else ["sh", "-c", command]


def _iter_process_lines(proc: subprocess.Popen[str]) -> Iterator[str]:
    assert proc.stdout is not None
    for raw_line in iter(proc.stdout.readline, ""):
        yield raw_line.rstrip("\n")


def run_remote_stream(command: str) -> Iterable[str]:
    """Execute ``command`` locally or over SSH and yield output lines."""
    if not command.strip():
        raise ValueError("command must not be empty")

    ssh_cmd = _build_ssh_command(command)
    if ssh_cmd:
        popen_args = ssh_cmd
    else:
        popen_args = _build_local_command(command)

    proc = subprocess.Popen(  # noqa: S603
        popen_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True,
    )
    try:
        yield from _iter_process_lines(proc)
        returncode = proc.wait()
        if returncode:
            raise RuntimeError(f"command exited with status {returncode}")
    finally:
        with contextlib.suppress(Exception):
            proc.stdout and proc.stdout.close()
        with contextlib.suppress(Exception):
            if proc.poll() is None:
                proc.kill()
