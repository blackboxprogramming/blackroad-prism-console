import pytest

from prism_io.validate import validate_json, SchemaValidationError


def test_valid():
    validate_json({"intent": "x", "inputs": {}}, "task")


def test_invalid():
    with pytest.raises(SchemaValidationError):
        validate_json({"inputs": {}}, "task")
