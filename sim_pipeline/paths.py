"""Path utilities shared by the simulation orchestration helpers."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def project_path(*parts: str) -> Path:
    """Return a path under the repository root."""

    return PROJECT_ROOT.joinpath(*parts)


def ensure_directory(path: Path) -> Path:
    """Create *path* if it does not exist and return it."""

    path.mkdir(parents=True, exist_ok=True)
    return path
