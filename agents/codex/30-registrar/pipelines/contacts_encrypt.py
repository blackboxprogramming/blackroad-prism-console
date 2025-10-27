"""Utility helpers for encrypting contact records and producing redaction diffs."""
from __future__ import annotations

import base64
import hashlib
import os
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Tuple

DEFAULT_SENSITIVE_FIELDS: Tuple[str, ...] = (
    "ssn",
    "dob",
    "account",
    "home_address",
    "email",
    "phone",
)


@dataclass(frozen=True)
class Redaction:
    """Structure describing how a sensitive field was redacted."""

    path: str
    previous: str
    redacted: str = "[REDACTED]"


class FieldVault:
    """Lightweight keyed vault for sealing sensitive fields.

    The vault uses PBKDF2 to derive a keyed digest from the supplied master key and field path.
    The resulting payload is base64 encoded so it can be persisted in YAML/JSON artifacts.
    While this is not reversible encryption, it keeps raw values out of rest artifacts and
    allows equality checks when the same secret is sealed twice with the same key.
    """

    def __init__(self, master_key: str) -> None:
        if not master_key:
            raise ValueError("master_key is required to seal contacts")
        self._key_material = master_key.encode("utf-8")

    def seal(self, path: str, value: str) -> str:
        salt = os.urandom(12)
        info = path.encode("utf-8") + b"::codex30"
        digest = hashlib.pbkdf2_hmac(
            "sha256", value.encode("utf-8"), self._key_material + info + salt, 48000, dklen=32
        )
        payload = salt + digest
        return base64.urlsafe_b64encode(payload).decode("ascii")


def _seal_list(
    payload: List[Any],
    vault: FieldVault,
    sensitive_fields: Iterable[str],
    prefix: str,
    redactions: List[Redaction],
    parent_is_sensitive: bool,
) -> List[Any]:
    sealed: List[Any] = []
    for index, value in enumerate(payload):
        path = f"{prefix}[{index}]"
        if isinstance(value, dict):
            sealed.append(_seal_dict(value, vault, sensitive_fields, path, redactions))
        elif isinstance(value, list):
            sealed.append(
                _seal_list(value, vault, sensitive_fields, path, redactions, parent_is_sensitive)
            )
        elif parent_is_sensitive and isinstance(value, str):
            redactions.append(Redaction(path=path, previous=value))
            sealed.append(vault.seal(path, value))
        else:
            sealed.append(value)
    return sealed


def _seal_dict(
    payload: Dict[str, Any],
    vault: FieldVault,
    sensitive_fields: Iterable[str],
    prefix: str,
    redactions: List[Redaction],
) -> Dict[str, Any]:
    sealed: Dict[str, Any] = {}
    for key, value in payload.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            sealed[key] = _seal_dict(value, vault, sensitive_fields, path, redactions)
            continue
        if isinstance(value, list):
            sealed[key] = _seal_list(
                value, vault, sensitive_fields, path, redactions, key in sensitive_fields
            )
            continue
        if key in sensitive_fields and isinstance(value, str):
            redactions.append(Redaction(path=path, previous=value))
            sealed[key] = vault.seal(path, value)
        else:
            sealed[key] = value
    return sealed


def seal_contacts(
    contacts: Dict[str, Any],
    master_key: str,
    sensitive_fields: Iterable[str] = DEFAULT_SENSITIVE_FIELDS,
) -> Tuple[Dict[str, Any], List[Redaction]]:
    """Return an encrypted copy of ``contacts`` and the redaction diff list."""

    vault = FieldVault(master_key)
    redactions: List[Redaction] = []
    sealed = _seal_dict(contacts, vault, tuple(sensitive_fields), prefix="", redactions=redactions)
    return sealed, redactions


def redact_contacts(contacts: Dict[str, Any], redactions: Iterable[Redaction]) -> Dict[str, Any]:
    """Apply redaction placeholders to a contacts payload.

    This helper is useful when embedding contact snippets into packets or receipts.
    """

    import copy

    result = copy.deepcopy(contacts)
    for redaction in redactions:
        parts = redaction.path.split(".")
        target = result
        for part in parts[:-1]:
            obj = target.get(part)
            if not isinstance(obj, dict):
                obj = {}
                target[part] = obj
            target = obj
        target[parts[-1]] = redaction.redacted
    return result


__all__ = ["DEFAULT_SENSITIVE_FIELDS", "FieldVault", "Redaction", "seal_contacts", "redact_contacts"]
