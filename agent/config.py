"""Configuration helpers for the BlackRoad agent services."""
from __future__ import annotations

import os
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict

import yaml

CONFIG_PATH = Path(os.environ.get("BLACKROAD_CONFIG", "/etc/blackroad/config.yaml"))

DEFAULTS: Dict[str, Any] = {
    "jetson": {"host": "192.168.4.23", "user": "jetson"},
    "auth": {"token": ""},
}


def _deep_update(base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = _deep_update(dict(base[key]), value)
        else:
            base[key] = value
    return base


def load() -> Dict[str, Any]:
    """Load the persisted configuration merged with defaults."""
    data: Dict[str, Any] = {}
    if CONFIG_PATH.exists():
        try:
            raw = yaml.safe_load(CONFIG_PATH.read_text())
            if isinstance(raw, dict):
                data = raw
        except yaml.YAMLError:
            data = {}
    merged = deepcopy(DEFAULTS)
    return _deep_update(merged, data)


def save(config: Dict[str, Any]) -> None:
    """Persist the configuration to disk."""
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CONFIG_PATH.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(config, handle, sort_keys=True)


def auth_token() -> str:
    """Return the configured authentication token (empty when disabled)."""
    return str(load().get("auth", {}).get("token", ""))
"""Configuration helpers for tracking the active Jetson target."""
"""Helpers for reading and writing the BlackRoad agent configuration."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

DEFAULT_USER = "jetson"
CONFIG_ENV_VAR = "BLACKROAD_CONFIG"
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import yaml

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
