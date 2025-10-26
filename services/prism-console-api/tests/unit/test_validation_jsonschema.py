import pytest

from prism.services.validation import ValidationError, validate_payload


def test_validate_payload_allows_valid_input() -> None:
    schema = {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}
    validate_payload(schema, {"name": "gateway"})


def test_validate_payload_raises_on_invalid_input() -> None:
    schema = {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}
    with pytest.raises(ValidationError):
        validate_payload(schema, {})
