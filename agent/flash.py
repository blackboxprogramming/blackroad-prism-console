"""Placeholder helpers for firmware/OS flashing routines."""
from __future__ import annotations

from typing import Any, Dict, Optional

from agent import jobs


def probe(host: Optional[str] = None, user: Optional[str] = None) -> Dict[str, Any]:
    """Check if the remote target is reachable."""
    try:
        result = jobs.run_remote("uname -a", host=host, user=user)
        ok = result.returncode == 0
        return {"ok": ok, "output": result.stdout.strip() if ok else result.stderr.strip()}
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}


def reboot(host: Optional[str] = None, user: Optional[str] = None) -> Dict[str, Any]:
    """Request a remote reboot. Users must ensure they have sudo rights."""
    try:
        result = jobs.run_remote("sudo reboot", host=host, user=user)
        return {"ok": result.returncode == 0}
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}


__all__ = ["probe", "reboot"]
