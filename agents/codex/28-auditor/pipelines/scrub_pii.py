"""Redaction helpers for personally identifiable information (PII)."""

from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, Iterable, List, Tuple

DEFAULT_STRATEGY = "mask"
MASK_TOKEN = "██REDACTED██"
_HASH_SALT = "codex-28::auditor"
_PII_FIELDS = {
    "email",
    "phone",
    "ssn",
    "dob",
    "address",
    "name",
    "token",
    "secret",
    "password",
    "api_key",
}
_PII_PATTERNS: Tuple[Tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"(?i)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"), "email"),
    (
        re.compile(r"(?i)\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b"),
        "phone",
    ),
    (re.compile(r"(?i)\bssn[:=]?\s*\d{3}-?\d{2}-?\d{4}\b"), "ssn"),
)

RedactionDiff = Dict[str, Any]


def _apply_strategy(value: Any, strategy: str) -> Any:
    if strategy == "drop":
        return None
    if strategy == "hash-salt":
        digest = hashlib.sha256(f"{_HASH_SALT}:{value}".encode("utf-8")).hexdigest()
        return digest
    return MASK_TOKEN


def _scrub_string(text: str, strategy: str, path: str, diffs: List[RedactionDiff]) -> str:
    scrubbed = text
    for pattern, label in _PII_PATTERNS:
        matches = list(pattern.finditer(scrubbed))
        if not matches:
            continue
        replacement = (
            lambda match: _apply_strategy(match.group(0), strategy)
            if strategy == "hash-salt"
            else MASK_TOKEN
        )
        scrubbed = pattern.sub(replacement, scrubbed)
        diffs.append(
            {
                "field": path,
                "original": text,
                "redacted": scrubbed,
                "strategy": strategy,
                "label": label,
            }
        )
    return scrubbed


def _scrub_mapping(
    mapping: Dict[str, Any], strategy: str, path: List[str], diffs: List[RedactionDiff]
) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for key, value in mapping.items():
        lowered = key.lower()
        current_path = path + [key]
        joined = ".".join(current_path)
        if lowered in _PII_FIELDS:
            redacted = _apply_strategy(value, strategy)
            diffs.append(
                {
                    "field": joined,
                    "original": value,
                    "redacted": redacted,
                    "strategy": strategy,
                    "label": lowered,
                }
            )
            if strategy == "drop":
                continue
            result[key] = redacted
            continue
        result[key] = _scrub_value(value, strategy, current_path, diffs)
    return result


def _scrub_iterable(
    iterable: Iterable[Any], strategy: str, path: List[str], diffs: List[RedactionDiff]
) -> List[Any]:
    result: List[Any] = []
    for index, value in enumerate(iterable):
        current_path = path + [str(index)]
        scrubbed = _scrub_value(value, strategy, current_path, diffs)
        if strategy == "drop" and scrubbed is None:
            continue
        result.append(scrubbed)
    return result


def _scrub_value(value: Any, strategy: str, path: List[str], diffs: List[RedactionDiff]) -> Any:
    if isinstance(value, dict):
        return _scrub_mapping(value, strategy, path, diffs)
    if isinstance(value, list):
        return _scrub_iterable(value, strategy, path, diffs)
    if isinstance(value, str):
        return _scrub_string(value, strategy, ".".join(path), diffs)
    return value


def scrub(payload: Any, strategy: str = DEFAULT_STRATEGY, return_diffs: bool = False):
    """Redact sensitive information from ``payload``.

    Parameters
    ----------
    payload:
        Arbitrary JSON-like structure containing potential PII.
    strategy:
        One of ``"mask"``, ``"drop"``, or ``"hash-salt"``.
    return_diffs:
        When ``True`` the function returns a tuple ``(sanitised, diffs)``.

    Returns
    -------
    Any or Tuple[Any, List[RedactionDiff]]
        Scrubbed payload, optionally accompanied by the redaction diff records.
    """

    if strategy not in {"mask", "drop", "hash-salt"}:
        raise ValueError("strategy must be one of 'mask', 'drop', or 'hash-salt'")

    diffs: List[RedactionDiff] = []
    scrubbed = _scrub_value(payload, strategy, [], diffs)

    if isinstance(scrubbed, dict) and any(
        key in scrubbed for key in ("artifacts", "logs", "metadata", "metrics")
    ):
        metadata = scrubbed.get("metadata")
        if not isinstance(metadata, dict):
            metadata = {}
        metadata["pii_scrubbed"] = True
        scrubbed["metadata"] = metadata

    if return_diffs:
        return scrubbed, diffs
    return scrubbed


__all__ = ["scrub", "MASK_TOKEN", "DEFAULT_STRATEGY"]
