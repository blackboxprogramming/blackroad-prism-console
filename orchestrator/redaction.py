from __future__ import annotations

import hashlib
import re
from typing import Any

from orchestrator import metrics

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CC_RE = re.compile(r"\b(?:\d[ -]*?){13,16}\b")


def _token(value: str, kind: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:8]
    return f"{{{{REDACTED:{kind}:{digest}}}}}"


def _scrub_str(text: str) -> tuple[str, int]:
    count = 0
    for kind, regex in {
        "email": EMAIL_RE,
        "phone": PHONE_RE,
        "ssn": SSN_RE,
        "cc": CC_RE,
    }.items():
        def repl(match: re.Match[str]) -> str:
            nonlocal count
            count += 1
            return _token(match.group(0), kind)

        text = regex.sub(repl, text)
    return text, count


def scrub(obj: Any) -> Any:
    """Recursively scrub PII from the provided object."""
    if obj is None:
        return None
    if isinstance(obj, str):
        cleaned, cnt = _scrub_str(obj)
        if cnt:
            metrics.inc("redactions_applied", cnt)
        return cleaned
    if isinstance(obj, list):
        return [scrub(x) for x in obj]
    if isinstance(obj, dict):
        return {k: scrub(v) for k, v in obj.items()}
    return obj
