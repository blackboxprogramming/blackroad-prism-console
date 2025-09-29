"""Runtime configuration helpers for remote GPU transcription."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Tuple

_DEFAULT_TARGET = ("jetson.local", "ubuntu")


def _parse_target(target: str) -> Tuple[str, str]:
    """Parse a "user@host" style target string."""
    if "@" in target:
        user, host = target.split("@", 1)
        user = user or _DEFAULT_TARGET[1]
        host = host or _DEFAULT_TARGET[0]
        return host, user
    return (target or _DEFAULT_TARGET[0], _DEFAULT_TARGET[1])


@lru_cache(maxsize=1)
def active_target() -> Tuple[str, str]:
    """Return the SSH host/user tuple for the Jetson target."""
    target = os.getenv("JETSON_TARGET")
    host_env = os.getenv("JETSON_HOST") or os.getenv("BLACKROAD_JETSON_HOST")
    user_env = os.getenv("JETSON_USER") or os.getenv("BLACKROAD_JETSON_USER")

    if target:
        host, user = _parse_target(target)
    else:
        host = host_env or _DEFAULT_TARGET[0]
        user = user_env or _DEFAULT_TARGET[1]
    return host, user
