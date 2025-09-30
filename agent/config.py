"""Runtime configuration helpers for Pi ↔ Jetson orchestration."""

from __future__ import annotations

import os
from typing import Tuple


def active_target() -> Tuple[str, str]:
    """Return the SSH target (host, user) for the Jetson worker.

    The helper checks the following environment variables in order:

    1. ``JETSON_TARGET`` – formatted as ``"user@host"`` or just ``"host"``
       (falls back to ``JETSON_USER``/``JETSON_HOST`` for missing pieces).
    2. ``JETSON_HOST`` and ``JETSON_USER`` individually.

    If nothing is configured, ``jetson.local`` and ``ubuntu`` are returned so
    the rest of the stack has sensible defaults during development.
    """

    target = os.environ.get("JETSON_TARGET", "").strip()
    host = os.environ.get("JETSON_HOST", "").strip()
    user = os.environ.get("JETSON_USER", "").strip()

    if target:
        if "@" in target:
            user_part, host_part = target.split("@", 1)
            user = user or user_part
            host = host or host_part
        else:
            host = host or target

    if not host:
        host = "jetson.local"
    if not user:
        user = "ubuntu"

    return host, user


__all__ = ["active_target"]

