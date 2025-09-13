"""Application settings.

This module centralises runtime configuration for the console.  Values are
kept simple so tests can tweak them easily.  Environment variables are not
used to keep the code fully offline and deterministic.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class Settings:
    """Basic settings container."""

    CACHE_TTL_SECONDS: int = 60
    CACHE_BACKEND: str = "memory"
    RANDOM_SEED: int = 1
    LOG_LEVEL: str = "INFO"


settings = Settings()
