"""Telemetry helpers for the BlackRoad dashboard."""

from __future__ import annotations

from typing import Any, Dict


def collect_local() -> Dict[str, Any]:
    """Collect telemetry for the local device.

    Placeholder implementation returning an empty payload when telemetry
    commands are unavailable in the development environment.
    """

    return {}


def collect_remote(host: str, user: str = "jetson") -> Dict[str, Any]:
    """Collect telemetry for a remote device via SSH.

    Placeholder implementation returning an empty payload.
    """

    return {}
