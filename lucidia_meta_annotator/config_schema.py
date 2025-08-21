"""Configuration loading and validation."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict
import yaml

from .security import verify_config

SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "Applicability": {
            "type": "object",
            "properties": {
                "VariablePattern": {"type": "string"},
            },
            "additionalProperties": False,
        },
        "Attributes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Name": {"type": "string"},
                    "Value": {},
                    "Remove": {"type": "boolean"},
                },
                "required": ["Name"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["Attributes"],
    "additionalProperties": False,
}

class ConfigError(ValueError):
    """Raised when configuration fails validation."""


def _validate(config: Dict[str, Any]) -> None:
    """Minimal JSON schema validation without external deps."""
    def fail(msg: str) -> None:
        raise ConfigError(msg)

    if not isinstance(config, dict):
        fail("config must be a mapping")
    for key in config:
        if key not in SCHEMA["properties"]:
            fail(f"unknown top-level field: {key}")
    attrs = config.get("Attributes")
    if not isinstance(attrs, list):
        fail("Attributes must be a list")
    for item in attrs:
        if not isinstance(item, dict):
            fail("Attribute entries must be objects")
        if "Name" not in item:
            fail("Attribute missing Name")
        for k in item:
            if k not in ("Name", "Value", "Remove"):
                fail(f"Unknown field in attribute: {k}")
        if "Remove" in item and item.get("Remove"):
            if "Value" in item:
                fail("Cannot specify Value with Remove")


def load_config(path: str | Path, *, verify_signature: bool = False, signature_path: str | Path | None = None) -> Dict[str, Any]:
    """Load a JSON or YAML configuration file and validate it."""
    p = Path(path)
    text = p.read_text()
    if p.suffix in {".json"}:
        config = json.loads(text)
    else:
        config = yaml.safe_load(text)
    _validate(config)
    if verify_signature:
        verify_config(p, signature_path)
    return config
