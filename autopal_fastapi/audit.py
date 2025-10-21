"""Audit helpers that enrich events with trace context and metrics."""

from __future__ import annotations

import datetime
import json
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from opentelemetry import metrics, trace
from opentelemetry.metrics import Meter
from opentelemetry.trace import Span, format_span_id, format_trace_id


@dataclass(frozen=True)
class TraceIds:
    """Container for formatted trace/span identifiers."""

    trace_id: Optional[str] = None
    span_id: Optional[str] = None

    @property
    def is_valid(self) -> bool:
        return bool(self.trace_id)


def _current_trace_ids(span: Optional[Span] = None) -> TraceIds:
    span = span or trace.get_current_span()
    if span is None:
        return TraceIds()
    context = span.get_span_context()
    if not context or not context.is_valid:
        return TraceIds()
    trace_id = format_trace_id(context.trace_id)
    span_id = format_span_id(context.span_id)
    # OpenTelemetry represents invalid identifiers as all zeros. Guard against
    # including those in audit payloads.
    if trace_id == "0" * 32:
        return TraceIds()
    if span_id == "0" * 16:
        return TraceIds(trace_id=trace_id)
    return TraceIds(trace_id=trace_id, span_id=span_id)


def current_trace_ids() -> TraceIds:
    """Expose the active span identifiers for use by the FastAPI app."""

    return _current_trace_ids()


class AuditLogger:
    """File-backed audit logger that also emits OpenTelemetry metrics."""

    def __init__(self, path: Path, meter: Optional[Meter] = None) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._meter = meter or metrics.get_meter("autopal.fastapi.audit")
        self._counter = self._meter.create_counter(
            "autopal.audit.events_total",
            description="Count of audit events emitted by Autopal FastAPI",
        )
        self._duration_hist = self._meter.create_histogram(
            "autopal.http.server.duration",
            unit="ms",
            description="HTTP request durations processed by Autopal FastAPI",
        )

    @classmethod
    def from_environment(cls) -> "AuditLogger":
        default_path = Path.cwd() / "logs" / "autopal-fastapi-audit.jsonl"
        configured = os.getenv("AUTOPAL_AUDIT_LOG_PATH")
        path = Path(configured).expanduser() if configured else default_path
        return cls(path)

    def log(self, event: str, **fields: Any) -> None:
        payload: Dict[str, Any] = {
            "timestamp": datetime.datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
            "event": event,
            **fields,
        }

        ids = _current_trace_ids()
        if ids.trace_id:
            payload["trace_id"] = ids.trace_id
        if ids.span_id:
            payload["span_id"] = ids.span_id

        duration_ms = fields.get("duration_ms")
        if isinstance(duration_ms, (int, float)):
            self._duration_hist.record(
                float(duration_ms),
                attributes={
                    "event": event,
                    "path": str(fields.get("path", "unknown")),
                    "method": str(fields.get("method", "unknown")),
                    "status": str(fields.get("status", "")),
                },
            )

        self._counter.add(1, attributes={"event": event, "status": str(fields.get("status", ""))})

        serialized = json.dumps(payload, sort_keys=True)
        with self._lock:
            with open(self.path, "a", encoding="utf-8") as handle:
                handle.write(serialized)
                handle.write("\n")


def append_trace_headers(response, ids: TraceIds) -> None:
    """Attach trace identifiers to the outgoing response headers when present."""

    if not ids.is_valid:
        return
    response.headers["X-Trace-Id"] = ids.trace_id  # type: ignore[index]
    if ids.span_id:
        response.headers["X-Span-Id"] = ids.span_id  # type: ignore[index]
