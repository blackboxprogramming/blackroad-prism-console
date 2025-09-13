import json
from pathlib import Path
from typing import Any, Dict

from metrics import record


class SchemaValidationError(ValueError):
    pass


def _check(obj: Any, schema: Dict[str, Any]) -> None:
    t = schema.get("type")
    if t == "object":
        if not isinstance(obj, dict):
            raise SchemaValidationError("expected object")
        for req in schema.get("required", []):
            if req not in obj:
                raise SchemaValidationError(f"missing {req}")
        for key, subschema in schema.get("properties", {}).items():
            if key in obj:
                _check(obj[key], subschema)
    elif t == "string":
        if not isinstance(obj, str):
            raise SchemaValidationError("expected string")
    elif t == "boolean":
        if not isinstance(obj, bool):
            raise SchemaValidationError("expected boolean")
    elif t == "array":
        if not isinstance(obj, list):
            raise SchemaValidationError("expected array")
    elif t == "number":
        if not isinstance(obj, (int, float)):
            raise SchemaValidationError("expected number")


def validate_json(obj: Any, schema_name: str) -> None:
    schema_path = Path(__file__).resolve().parent.parent / "schemas" / f"{schema_name}.schema.json"
    schema = json.loads(schema_path.read_text())
    try:
        _check(obj, schema)
    except SchemaValidationError as e:
        record("schema_validation_error")
        raise
