"""Utility helpers for the simulation orchestration pipeline."""

from importlib import metadata

__all__ = ["__version__"]


def __getattr__(name: str):
    if name == "__version__":
        try:
            return metadata.version("sim_pipeline")
        except metadata.PackageNotFoundError:  # pragma: no cover - best effort only
            return "0.0.0"
    raise AttributeError(name)
