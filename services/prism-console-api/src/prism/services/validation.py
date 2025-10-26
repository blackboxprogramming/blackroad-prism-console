from __future__ import annotations

from jsonschema import Draft202012Validator, ValidationError


def validate_payload(schema: dict, payload: dict) -> None:
    validator = Draft202012Validator(schema)
    validator.validate(payload)


__all__ = ["validate_payload", "ValidationError"]
