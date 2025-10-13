"""JSON audit logging utilities for Autopal."""

from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable

from .config import AuditConfig


@dataclass
class AuditRecord:
    """Structured representation of an audit event."""

    event: str
    ts: int
    payload: dict[str, Any]

    def to_json(self) -> str:
        return json.dumps({"ts": self.ts, "event": self.event, **self.payload}, default=str, separators=(",", ":"))


class AuditLogger:
    """Emit compact JSON audit events."""

    def __init__(self, writer: Callable[[str], None] | None = None) -> None:
        self._writer = writer or (lambda msg: print(msg, file=sys.stdout, flush=True))

    def log(self, config: AuditConfig, event: str, **context: Any) -> None:
        """Log an event when auditing is enabled."""

        if not config.enabled:
            return
        payload = {key: self._maybe_redact(key, value, config) for key, value in context.items()}
        record = AuditRecord(event=event, ts=int(time.time()), payload=payload)
        self._writer(record.to_json())

    @staticmethod
    def _maybe_redact(key: str, value: Any, config: AuditConfig) -> Any:
        if not config.redact_values:
            return value
        lowered = key.lower()
        if any(token in lowered for token in ("token", "secret", "authorization", "password")):
            return "<redacted>"
        return value


__all__ = ["AuditLogger", "AuditRecord"]
