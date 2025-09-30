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
