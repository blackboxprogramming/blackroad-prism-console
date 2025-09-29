"""Configuration helpers for tracking the active Jetson target."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

DEFAULT_USER = "jetson"
CONFIG_ENV_VAR = "BLACKROAD_CONFIG"
DEFAULT_CONFIG_PATH = Path("/etc/blackroad/config.yaml")


def _config_path() -> Path:
    """Resolve the configuration path, honoring overrides."""
    env_path = os.environ.get(CONFIG_ENV_VAR)
    if env_path:
        return Path(env_path)
    return DEFAULT_CONFIG_PATH


def _load_config() -> Dict[str, Any]:
    path = _config_path()
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
            if isinstance(data, dict):
                return data
    except yaml.YAMLError:
        # Corrupt YAML shouldn't crash the dashboard; treat as empty.
        return {}
    except OSError:
        return {}
    return {}


def _write_config(data: Dict[str, Any]) -> None:
    path = _config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as fh:
        yaml.safe_dump(data, fh, sort_keys=True)
    tmp_path.replace(path)


def active_target() -> Optional[Dict[str, str]]:
    cfg = _load_config()
    target = cfg.get("jetson") if isinstance(cfg, dict) else None
    if isinstance(target, dict):
        host = target.get("host")
        user = target.get("user", DEFAULT_USER)
        if host:
            return {"host": host, "user": user}
    return None


def set_target(host: str, user: str = DEFAULT_USER) -> None:
    if not host:
        raise ValueError("host must be provided")
    user = user or DEFAULT_USER
    cfg = _load_config()
    if not isinstance(cfg, dict):
        cfg = {}
    cfg["jetson"] = {"host": host, "user": user}
    _write_config(cfg)


__all__ = ["active_target", "set_target", "DEFAULT_USER"]
