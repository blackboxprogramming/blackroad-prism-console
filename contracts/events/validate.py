"""Simple structural validator for event envelopes."""
import json
import sys
from typing import Any, Dict, List


def _validate_struct(data: Any, schema: Any, path: str = "") -> List[str]:
    errors: List[str] = []
    if isinstance(schema, dict):
        if not isinstance(data, dict):
            return [f"Expected object at {path or 'root'}"]
        for key, subschema in schema.items():
            if key not in data:
                errors.append(f"Missing key: {path + key}")
            else:
                errors.extend(_validate_struct(data[key], subschema, path + key + "."))
    else:
        if not isinstance(data, type(schema)):
            errors.append(f"Wrong type at {path[:-1]}: expected {type(schema).__name__}")
    return errors


def validate(envelope: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
    required = ["source", "type", "id", "ts", "actor", "payload", "headers"]
    errors = [f"Missing key: {k}" for k in required if k not in envelope]
    if envelope.get("id") in (None, ""):
        errors.append("Idempotency key 'id' required")
    errors.extend(_validate_struct(envelope, schema))
    return errors


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python validate.py path/to/envelope.json path/to/schema.json")
        return 1
    envelope = json.load(open(sys.argv[1]))
    schema = json.load(open(sys.argv[2]))
    errs = validate(envelope, schema)
    if errs:
        for e in errs:
            print(e)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
