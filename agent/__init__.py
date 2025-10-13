"""BlackRoad agent package."""

from .config import load, save, auth_token  # noqa: F401
"""BlackRoad device agent package."""

__all__ = ["api", "config", "discover"]
from .config import active_target, set_target

__all__ = ["active_target", "set_target"]
