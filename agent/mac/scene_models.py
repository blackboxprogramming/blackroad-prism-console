"""Shared utilities for YAML-driven scene playback."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

try:  # pragma: no cover - dependency availability handled at runtime
    import yaml  # type: ignore
except ImportError:  # pragma: no cover - dependency availability handled at runtime
    yaml = None  # type: ignore

try:  # pragma: no cover - dependency availability handled at runtime
    from jsonschema import Draft7Validator
except ImportError:  # pragma: no cover - dependency availability handled at runtime
    Draft7Validator = None  # type: ignore


class SceneValidationError(RuntimeError):
    """Raised when a scene definition cannot be parsed or validated."""


@dataclass(frozen=True)
class SceneStep:
    """A single MQTT publication within a scene."""

    index: int
    topic: str
    payload: Dict[str, Any]
    delay: float = 0.0
    wait: float = 0.0
    label: Optional[str] = None


@dataclass(frozen=True)
class Scene:
    """In-memory representation of a scene file."""

    path: Path
    name: str
    description: Optional[str]
    steps: List[SceneStep]


SCENE_SCHEMA: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["name", "steps"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "description": {"type": "string"},
        "defaults": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "minLength": 1},
                "delay": {"type": "number", "minimum": 0},
                "wait": {"type": "number", "minimum": 0},
                "payload": {"type": "object"},
            },
            "additionalProperties": False,
        },
        "steps": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["payload"],
                "properties": {
                    "label": {"type": "string"},
                    "topic": {"type": "string", "minLength": 1},
                    "payload": {"type": "object"},
                    "delay": {"type": "number", "minimum": 0},
                    "wait": {"type": "number", "minimum": 0},
                },
                "additionalProperties": False,
            },
        },
    },
    "additionalProperties": False,
}


def _ensure_yaml() -> None:
    if yaml is None:  # pragma: no cover - environment specific
        raise SceneValidationError(
            "PyYAML is required to load scene files. Install it via `pip install pyyaml`."
        )


def _ensure_jsonschema() -> None:
    if Draft7Validator is None:  # pragma: no cover - environment specific
        raise SceneValidationError(
            "jsonschema is required to validate scene files. Install it via `pip install jsonschema`."
        )


def _load_raw_yaml(path: Path) -> Dict[str, Any]:
    _ensure_yaml()
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:  # pragma: no cover - simple filesystem errors
        raise SceneValidationError(f"Scene file not found: {path}") from exc
    except yaml.YAMLError as exc:  # type: ignore[attr-defined]
        raise SceneValidationError(f"Invalid YAML in {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise SceneValidationError(f"Scene file must contain a mapping at the top level: {path}")
    return data


def validate_scene_document(document: Dict[str, Any], *, path: Optional[Path] = None) -> None:
    """Validate a scene document against the schema."""

    _ensure_jsonschema()
    validator = Draft7Validator(SCENE_SCHEMA)  # type: ignore[operator]
    errors = sorted(validator.iter_errors(document), key=lambda err: err.path)
    if errors:
        location = f" in {path}" if path else ""
        messages = "; ".join(error.message for error in errors)
        raise SceneValidationError(f"Scene validation failed{location}: {messages}")


def _coerce_non_negative(value: Any, *, field: str, default: float = 0.0) -> float:
    if value is None:
        return float(default)
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise SceneValidationError(f"Scene step field '{field}' must be numeric") from exc
    if number < 0:
        raise SceneValidationError(f"Scene step field '{field}' must be >= 0")
    return number


def load_scene(path: Path) -> Scene:
    """Load and validate a scene file into an executable representation."""

    document = _load_raw_yaml(path)
    validate_scene_document(document, path=path)

    defaults = document.get("defaults", {})
    default_topic = defaults.get("topic")
    default_delay = _coerce_non_negative(defaults.get("delay"), field="defaults.delay", default=0.0)
    default_wait = _coerce_non_negative(defaults.get("wait"), field="defaults.wait", default=0.0)
    default_payload = defaults.get("payload") if isinstance(defaults.get("payload"), dict) else None

    steps: List[SceneStep] = []
    for index, raw_step in enumerate(document["steps"], start=1):
        topic = raw_step.get("topic", default_topic)
        if not topic:
            raise SceneValidationError(
                f"Step {index} in {path} is missing a topic and no default was provided"
            )
        payload = raw_step.get("payload")
        if not isinstance(payload, dict):
            raise SceneValidationError(
                f"Step {index} in {path} must define a payload object"
            )
        if default_payload:
            merged_payload = dict(default_payload)
            merged_payload.update(payload)
            payload = merged_payload
        delay = _coerce_non_negative(raw_step.get("delay"), field="delay", default=default_delay)
        wait = _coerce_non_negative(raw_step.get("wait"), field="wait", default=default_wait)
        label = raw_step.get("label") if raw_step.get("label") else None
        steps.append(
            SceneStep(
                index=index,
                topic=str(topic),
                payload=payload,
                delay=delay,
                wait=wait,
                label=label,
            )
        )

    return Scene(
        path=path,
        name=str(document.get("name", path.stem)),
        description=document.get("description"),
        steps=steps,
    )
