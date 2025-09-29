"""Remote job execution helpers for Jetson hosts."""

from __future__ import annotations

import os
import shlex
import subprocess
from typing import Dict, Generator

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")


def _host_user(host: str | None = None, user: str | None = None) -> tuple[str, str]:
    """Resolve the host and user, falling back to defaults."""

    return (host or JETSON_HOST, user or JETSON_USER)


def run_remote_stream(
    host: str | None = None,
    command: str = "",
    user: str | None = None,
) -> Generator[str, None, None]:
    """Legacy helper that streams a one-shot remote command."""

    host, user = _host_user(host, user)
    proc = subprocess.Popen(
        ["ssh", f"{user}@{host}", command],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    try:
        if proc.stdout is None:  # pragma: no cover - defensive guard
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
    host: str | None = None,
    user: str | None = None,
) -> Dict[str, object]:
    """Start a remote job detached from SSH and capture PID/log paths."""

    host, user = _host_user(host, user)
    log = f"/tmp/blackroad_job_{jid}.log"
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    quoted_cmd = shlex.quote(f"exec setsid bash -lc '{command}'")
    remote = (
        "bash -lc 'set -m; "
        f"rm -f {shlex.quote(log)} {shlex.quote(pidf)}; "
        f"nohup bash -lc {quoted_cmd} "
        f"> {shlex.quote(log)} 2>&1 & echo $! > {shlex.quote(pidf)}; "
        f"disown; sleep 0.2; cat {shlex.quote(pidf)}'"
    )
    pid = subprocess.check_output(["ssh", f"{user}@{host}", remote], text=True).strip()
    return {"pid": int(pid), "log": log, "pidfile": pidf}


def tail_remote_log(
    log_path: str,
    host: str | None = None,
    user: str | None = None,
) -> Generator[str, None, None]:
    """Stream a remote logfile until EOF (caller decides when to stop)."""

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
        if proc.stdout is None:  # pragma: no cover - defensive guard
            return
        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        if proc.stdout is not None:
            proc.stdout.close()
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()


def remote_is_running(
    jid: int,
    host: str | None = None,
    user: str | None = None,
) -> bool:
    """Return True if the PID recorded for ``jid`` is still alive."""

    host, user = _host_user(host, user)
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    try:
        out = subprocess.check_output(
            [
                "ssh",
                f"{user}@{host}",
                "bash",
                "-lc",
                "pid=$(cat {pid} 2>/dev/null || echo); "
                'test -n "$pid" && kill -0 $pid 2>/dev/null && echo RUN || echo DEAD'
                .format(pid=shlex.quote(pidf)),
            ],
            text=True,
        ).strip()
        return out == "RUN"
    except Exception:
        return False


def remote_kill(
    jid: int,
    host: str | None = None,
    user: str | None = None,
    sig: str = "TERM",
) -> bool:
    """Send ``sig`` to the remote process associated with ``jid``."""

    host, user = _host_user(host, user)
    pidf = f"/tmp/blackroad_job_{jid}.pid"
    try:
        subprocess.check_call(
            [
                "ssh",
                f"{user}@{host}",
                "bash",
                "-lc",
                "pid=$(cat {pid} 2>/dev/null || echo); "
                'test -n "$pid" && kill -s {sig} $pid 2>/dev/null || true'.format(
                    pid=shlex.quote(pidf), sig=shlex.quote(sig)
                ),
            ]
        )
        return True
    except Exception:
        return False
