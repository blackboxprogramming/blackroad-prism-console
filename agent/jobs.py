"""Helpers for orchestrating Jetson-hosted jobs over SSH."""

from __future__ import annotations

import os
import re
import shlex
import subprocess
from typing import Dict, Generator, Optional

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")


def _host_user(host: Optional[str] = None, user: Optional[str] = None) -> tuple[str, str]:
    """Return the resolved ``(host, user)`` pair for SSH commands."""

    return host or JETSON_HOST, user or JETSON_USER


def run_remote_stream(host: Optional[str] = None, command: str = "", user: Optional[str] = None):
    """Legacy helper: stream a one-shot remote command over SSH."""

    host, user = _host_user(host, user)
    proc = subprocess.Popen(
        ["ssh", f"{user}@{host}", command],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    try:
        if proc.stdout is None:  # pragma: no cover - defensive
            return
        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        if proc.stdout is not None:
            proc.stdout.close()
        proc.wait()


def start_remote_logged(
    jid: int,
    command: str,
    host: Optional[str] = None,
    user: Optional[str] = None,
) -> Dict[str, int | str]:
    """Start a detached remote job and return metadata about the process."""

    host, user = _host_user(host, user)
    log = f"/tmp/blackroad_job_{jid}.log"
    pidf = f"/tmp/blackroad_job_{jid}.pid"

    quoted_command = shlex.quote(f"exec setsid bash -lc '{command}'")
    remote_cmd = (
        "bash -lc 'set -m; "
        f"rm -f {shlex.quote(log)} {shlex.quote(pidf)}; "
        f"nohup bash -lc {quoted_command} > {shlex.quote(log)} 2>&1 & "
        f"echo $! > {shlex.quote(pidf)}; disown; sleep 0.2; "
        f"cat {shlex.quote(pidf)}'"
    )
    pid_txt = subprocess.check_output(["ssh", f"{user}@{host}", remote_cmd], text=True).strip()
    pid = int(pid_txt)
    return {"pid": pid, "log": log, "pidfile": pidf}


def tail_remote_log(
    log_path: str,
    host: Optional[str] = None,
    user: Optional[str] = None,
) -> Generator[str, None, None]:
    """Yield log lines from the remote ``log_path`` using ``tail -F``."""

    host, user = _host_user(host, user)
    cmd = [
        "ssh",
        f"{user}@{host}",
        "bash",
        "-lc",
        f"tail -n +1 -F {shlex.quote(log_path)}",
    ]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    try:
        if proc.stdout is None:  # pragma: no cover - defensive
            return
        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        if proc.stdout is not None:
            proc.stdout.close()
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:  # pragma: no cover - best-effort cleanup
            proc.kill()


def remote_is_running(jid: int, host: Optional[str] = None, user: Optional[str] = None) -> bool:
    """Check whether the remote PID recorded for ``jid`` is still alive."""

    host, user = _host_user(host, user)
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    try:
        script = (
            f"bash -lc \"pid=$(cat {shlex.quote(pidf)} 2>/dev/null || echo); "
            "test -n \"$pid\" && kill -0 $pid 2>/dev/null && echo RUN || echo DEAD\""
        )
        out = subprocess.check_output(["ssh", f"{user}@{host}", script], text=True).strip()
        return out == "RUN"
    except Exception:
        return False


def remote_kill(
    jid: int,
    host: Optional[str] = None,
    user: Optional[str] = None,
    sig: str = "TERM",
) -> bool:
    """Send ``sig`` to the remote PID registered for ``jid``."""

    host, user = _host_user(host, user)
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    signal = sig if re.fullmatch(r"[A-Za-z0-9_+-]+", sig) else "TERM"
    try:
        script = (
            f"bash -lc \"pid=$(cat {shlex.quote(pidf)} 2>/dev/null || echo); "
            f"test -n \"$pid\" && kill -s {signal} $pid 2>/dev/null || true\""
        )
        subprocess.check_call(["ssh", f"{user}@{host}", script])
        return True
    except Exception:
        return False
