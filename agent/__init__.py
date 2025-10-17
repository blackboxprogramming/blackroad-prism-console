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
