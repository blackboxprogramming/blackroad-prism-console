"""Shared configuration helpers for Jetson bridge modules."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Tuple

DEFAULT_HOST = "jetson.local"
DEFAULT_USER = "jetson"


@lru_cache(maxsize=1)
def resolve_target(host: str | None = None, user: str | None = None) -> Tuple[str, str]:
    """Return the SSH target for the Jetson device.

    Parameters
    ----------
    host:
        Optional override for the Jetson hostname or IP. When ``None`` the
        ``JETSON_HOST`` environment variable is used. If the variable is not
        defined the function falls back to ``"jetson.local"`` so existing
        behavior remains unchanged on networks with working mDNS.
    user:
        Optional override for the SSH username. Defaults to the
        ``JETSON_USER`` environment variable or ``"jetson"`` when unset.

    The result is cached to avoid repeated environment lookups when modules
    build frequent telemetry snapshots.
    """

    env_host = os.getenv("JETSON_HOST", DEFAULT_HOST).strip() or DEFAULT_HOST
    env_user = os.getenv("JETSON_USER", DEFAULT_USER).strip() or DEFAULT_USER
    resolved_host = host or env_host
    resolved_user = user or env_user
    return resolved_host, resolved_user


__all__ = ["DEFAULT_HOST", "DEFAULT_USER", "resolve_target"]
