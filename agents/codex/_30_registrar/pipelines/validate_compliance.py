"""Validation helpers for registrar filing packets."""

from __future__ import annotations

from typing import Dict, List

REQUIRED_ROOT_FIELDS = {
    "entity_id": str,
    "jurisdiction": str,
    "documents": list,
    "checklist": list,
    "receipt": dict,
}

REQUIRED_RECEIPT_FIELDS = {
    "digest": str,
    "issued_at": str,
    "prepared_by": str,
}


def validate_packet(packet: Dict[str, object]) -> List[str]:
    """Validate the shape of a filing packet.

    Returns a list of validation errors. An empty list indicates the packet is
    structurally sound and can proceed to the Auditor for attestation.
    """

    errors: List[str] = []

    for field, expected_type in REQUIRED_ROOT_FIELDS.items():
        if field not in packet:
            errors.append(f"Missing required field: {field}")
            continue
        if not isinstance(packet[field], expected_type):
            errors.append(
                f"Field '{field}' expected {expected_type.__name__} got {type(packet[field]).__name__}"
            )

    documents = packet.get("documents", [])
    if isinstance(documents, list):
        for index, document in enumerate(documents):
            if not isinstance(document, str):
                errors.append(f"Document at index {index} must be a string")
    else:
        errors.append("Documents must be a list")

    checklist = packet.get("checklist", [])
    if isinstance(checklist, list):
        for index, item in enumerate(checklist):
            if not isinstance(item, dict):
                errors.append(f"Checklist item at index {index} must be an object")
                continue
            for key in ("item", "status"):
                if key not in item:
                    errors.append(f"Checklist item {index} missing '{key}'")
                elif not isinstance(item[key], str):
                    errors.append(
                        f"Checklist item {index} field '{key}' must be a string"
                    )
    else:
        errors.append("Checklist must be a list")

    receipt = packet.get("receipt", {})
    if isinstance(receipt, dict):
        for field, expected_type in REQUIRED_RECEIPT_FIELDS.items():
            if field not in receipt:
                errors.append(f"Receipt missing '{field}'")
            elif not isinstance(receipt[field], expected_type):
                errors.append(
                    f"Receipt field '{field}' must be {expected_type.__name__}"
                )
    else:
        errors.append("Receipt must be an object")

    return errors
