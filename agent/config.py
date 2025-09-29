"""Persistent configuration store for BlackRoad agent settings."""
from __future__ import annotations

import os
import pathlib
from typing import Tuple

import yaml

CONF_PATH = pathlib.Path(os.getenv("BLACKROAD_CONF", "/etc/blackroad/config.yaml"))

DEFAULTS = {
    "jetson": {"host": "192.168.4.23", "user": "jetson"},
}


def ensure_dir() -> None:
    """Ensure the configuration directory exists."""
    CONF_PATH.parent.mkdir(parents=True, exist_ok=True)


def load() -> dict:
    """Load configuration file, falling back to defaults on error."""
    try:
        with open(CONF_PATH, "r", encoding="utf-8") as file:
            data = yaml.safe_load(file) or {}
            merged = DEFAULTS.copy()
            merged.update(data)
            return merged
    except Exception:
        return DEFAULTS.copy()


def save(cfg: dict) -> None:
    """Persist configuration to disk."""
    ensure_dir()
    with open(CONF_PATH, "w", encoding="utf-8") as file:
        yaml.safe_dump(cfg, file, sort_keys=False)


def active_target() -> Tuple[str, str]:
    """Return the currently configured Jetson host and user."""
    cfg = load()
    jetson = cfg.get("jetson", {})
    return (
        jetson.get("host", DEFAULTS["jetson"]["host"]),
        jetson.get("user", DEFAULTS["jetson"]["user"]),
    )


def set_target(host: str, user: str) -> None:
    """Persist a new Jetson target."""
    cfg = load()
    cfg["jetson"] = {"host": host, "user": user}
    save(cfg)
