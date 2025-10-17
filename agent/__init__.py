"""Public interface for the BlackRoad agent package."""

from __future__ import annotations

import os
from pathlib import Path

from . import discover, jobs, models, store, telemetry, transcribe
from .config import active_target, auth_token, load, save, set_target

__all__ = [
    "DEFAULT_REMOTE_HOST",
    "DEFAULT_REMOTE_USER",
    "DEFAULT_DB_PATH",
    "_host_user",
    "auth_token",
    "active_target",
    "set_target",
    "load",
    "save",
    "discover",
    "jobs",
    "models",
    "store",
    "telemetry",
    "transcribe",
    "__version__",
]

DEFAULT_REMOTE_HOST = os.getenv("BLACKROAD_REMOTE_HOST", "jetson-01")
DEFAULT_REMOTE_USER = os.getenv("BLACKROAD_REMOTE_USER", "pi")
DEFAULT_DB_PATH = Path(os.getenv("BLACKROAD_JOBS_DB", "/var/lib/blackroad/jobs.db"))


def _host_user(host: str | None = None, user: str | None = None) -> tuple[str, str]:
    """Resolve the remote host/user pair for SSH operations."""

    resolved_host = host or DEFAULT_REMOTE_HOST
    resolved_user = user or DEFAULT_REMOTE_USER
    return resolved_host, resolved_user


__version__ = "0.1.0"
