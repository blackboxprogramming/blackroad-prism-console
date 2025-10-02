"""Blue/green release manager."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "data"
ENVS = DATA / "envs"
CURRENT = DATA / "current"


def stage(from_env: str, to_env: str) -> None:
    src = ENVS / from_env
    dst = ENVS / to_env
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("keys"))


def promote(to_env: str) -> None:
    target = ENVS / to_env
    if CURRENT.is_symlink():
        CURRENT.unlink()
    elif CURRENT.exists():
        if CURRENT.is_dir():
            shutil.rmtree(CURRENT)
        else:
            CURRENT.unlink()
    CURRENT.symlink_to(target)


def status() -> str:
    if CURRENT.is_symlink():
        return CURRENT.resolve().name
    return "none"
