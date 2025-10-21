"""BlackRoad agent package."""

from .config import load, save, auth_token  # noqa: F401
"""BlackRoad device agent package."""

__all__ = ["api", "config", "discover"]
from .config import active_target, set_target

__all__ = ["active_target", "set_target"]
"""Utility modules for the BlackRoad dashboard service."""
"""Utilities for the BlackRoad Pi voice pipeline."""

__all__ = ["config", "store", "transcribe"]

"""Core helpers for the Pi transcription pipeline."""

from . import config, store, transcribe  # re-export for convenience

__all__ = ["config", "store", "transcribe"]
"""BlackRoad device agent package."""

from . import telemetry as telemetry

__all__ = ["telemetry"]
"""Agent utilities for BlackRoad."""

__all__ = ["jobs", "telemetry"]
"""Utility helpers for the lightweight BlackRoad job runner."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple

__all__ = ["DEFAULT_REMOTE_HOST", "DEFAULT_REMOTE_USER", "DEFAULT_DB_PATH", "_host_user"]

DEFAULT_REMOTE_HOST = os.getenv("BLACKROAD_REMOTE_HOST", "jetson-01")
DEFAULT_REMOTE_USER = os.getenv("BLACKROAD_REMOTE_USER", "pi")
DEFAULT_DB_PATH = Path(os.getenv("BLACKROAD_JOBS_DB", "/var/lib/blackroad/jobs.db"))


def _host_user(host: str | None = None, user: str | None = None) -> Tuple[str, str]:
    """Resolve the remote host/user pair for SSH operations."""

    resolved_host = host or DEFAULT_REMOTE_HOST
    resolved_user = user or DEFAULT_REMOTE_USER
    return resolved_host, resolved_user
"""BlackRoad flashing agent package."""
"""BlackRoad backend helper modules."""

from . import jobs, telemetry, store

__all__ = ["jobs", "telemetry", "store"]
"""Agent package for BlackRoad dashboard utilities."""

__all__ = ["dashboard", "jobs", "telemetry"]
"""BlackRoad local agent package."""

__all__ = ["__version__"]
__version__ = "0.1.0"
"""Agent utilities for remote job orchestration."""

from . import jobs, store  # noqa: F401

__all__ = ["jobs", "store"]
"""Agent control surface utilities."""

from .flash import flash, list_devices

__all__ = ["flash", "list_devices"]
"""Agent package for BlackRoad Pi services."""

from . import flash  # re-export for convenience

__all__ = ["flash"]
"""Utilities for managing remote jobs executed on Jetson hosts."""

from . import jobs, store

__all__ = ["jobs", "store"]
"""BlackRoad agent service helpers."""

from . import api, config, flash, jobs, telemetry  # noqa: F401

__all__ = ["api", "config", "flash", "jobs", "telemetry"]
"""Utility modules for the BlackRoad agent dashboard."""

__all__ = []
