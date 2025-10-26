"""Minimal contact encryption helpers for registrar PII hygiene."""

from __future__ import annotations

import base64
import hashlib
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

SENSITIVE_DEFAULTS = ("ssn", "dob", "account", "home_address")


def _derive_key(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


def _xor_encrypt(value: str, key: bytes) -> str:
    data = value.encode("utf-8")
    cipher = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
    return base64.urlsafe_b64encode(cipher).decode("ascii")


def encrypt_contacts(
    records: Iterable[Dict[str, object]],
    secret: str,
    *,
    fields: Optional[Sequence[str]] = None,
) -> Tuple[List[Dict[str, object]], List[Dict[str, object]]]:
    """Encrypt sensitive fields in the provided contact records.

    Returns a tuple of ``(sanitized_records, redaction_receipts)`` where the first
    element can be safely stored and the second provides a high-level diff that
    can be shared with other agents.
    """

    key = _derive_key(secret)
    sensitive_fields = tuple(fields or SENSITIVE_DEFAULTS)
    sanitized: List[Dict[str, object]] = []
    receipts: List[Dict[str, object]] = []

    for record in records:
        updated = dict(record)
        receipt_entry = {"id": record.get("id"), "redacted_fields": []}
        for field in sensitive_fields:
            if field in record and record[field] not in (None, ""):
                ciphertext = _xor_encrypt(str(record[field]), key)
                updated[field] = f"encrypted:{ciphertext}"
                receipt_entry["redacted_fields"].append(field)
        if receipt_entry["redacted_fields"]:
            receipts.append(receipt_entry)
        sanitized.append(updated)

    return sanitized, receipts


def redact_contact(record: Dict[str, object]) -> Dict[str, object]:
    """Return a copy of the record with encrypted fields redacted."""

    redacted = {}
    for key, value in record.items():
        if isinstance(value, str) and value.startswith("encrypted:"):
            redacted[key] = "<redacted>"
        else:
            redacted[key] = value
    return redacted
