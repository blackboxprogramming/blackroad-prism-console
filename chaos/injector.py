"""Chaos injection profiles."""
from __future__ import annotations

from orchestrator.flags import set_flag

PROFILES = {
    "minimal": {
        "chaos.storage.delay_ms": 10,
        "chaos.storage.error_rate": 0.1,
    }
}


def enable(profile: str) -> None:
    for name, value in PROFILES.get(profile, {}).items():
        set_flag(name, value)


def disable() -> None:
    set_flag("chaos.storage.delay_ms", 0)
    set_flag("chaos.storage.error_rate", 0)
