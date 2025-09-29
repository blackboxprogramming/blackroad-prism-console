"""Helpers for reading and writing the BlackRoad agent configuration."""

from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import yaml

DEFAULT_CONFIG_PATH = Path("/etc/blackroad/config.yaml")


def _config_path() -> Path:
    """Return the path to the BlackRoad config file."""
    override = os.getenv("BLACKROAD_CONFIG")
    if override:
        return Path(override)
    return DEFAULT_CONFIG_PATH


def _load_config(path: Path | None = None) -> Dict[str, Any]:
    path = path or _config_path()
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            if isinstance(data, dict):
                return data
    except (OSError, yaml.YAMLError):
        pass
    return {}


def _write_config(data: Dict[str, Any], path: Path | None = None) -> None:
    path = path or _config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = yaml.safe_dump(data, sort_keys=True) if data else "{}\n"
    with tempfile.NamedTemporaryFile("w", delete=False, dir=str(path.parent), encoding="utf-8") as tmp:
        tmp.write(serialized)
        tmp_path = Path(tmp.name)
    os.replace(tmp_path, path)


def active_target() -> Dict[str, Any]:
    """Return the currently configured Jetson/SSH target."""
    config = _load_config()
    target = config.get("jetson")
    if isinstance(target, dict):
        return target
    return {}


def set_target(host: str, user: str = "jetson") -> None:
    """Persist the active target information to the config file."""
    config = _load_config()
    jetson = config.get("jetson") if isinstance(config.get("jetson"), dict) else {}
    jetson.update({
        "host": host,
        "user": user,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    config["jetson"] = jetson
    _write_config(config)
