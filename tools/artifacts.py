import hashlib
import json
from typing import Any

from . import storage

try:
    import jsonschema
except Exception:  # pragma: no cover
    jsonschema = None


def validate_and_write(path: str, data: Any, schema_path: str | None = None) -> None:
    if schema_path and jsonschema:
        schema = json.loads(storage.read(schema_path))
        jsonschema.validate(data, schema)
    content = json.dumps(data, sort_keys=True) if not isinstance(data, str) else data
    storage.write(path, content)
    sig = hashlib.sha256(content.encode("utf-8")).hexdigest()
    storage.write(path + ".sig", sig)
