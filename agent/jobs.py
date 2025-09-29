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
