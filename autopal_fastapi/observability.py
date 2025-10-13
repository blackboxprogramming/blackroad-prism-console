"""OpenTelemetry wiring for the Autopal FastAPI service."""

from __future__ import annotations

import os
import threading
from typing import Optional

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    ConsoleMetricExporter,
    MetricExportResult,
    MetricExporter,
    PeriodicExportingMetricReader,
)
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SpanExportResult,
    SpanExporter,
)

_DEFAULT_ENDPOINT = "http://localhost:4318"
_CONFIGURED = False
_LOCK = threading.Lock()


class _NoOpSpanExporter(SpanExporter):
    def export(self, spans) -> SpanExportResult:  # type: ignore[override]
        return SpanExportResult.SUCCESS

    def shutdown(self, timeout_millis: int = 10_000, timeout: Optional[int] = None, **kwargs) -> None:  # type: ignore[override]
        return None


class _NoOpMetricExporter(MetricExporter):
    def export(self, metric_data, timeout_millis: int = 10_000) -> MetricExportResult:  # type: ignore[override]
        return MetricExportResult.SUCCESS

    def shutdown(self, timeout_millis: int = 10_000, timeout: Optional[int] = None, **kwargs) -> None:  # type: ignore[override]
        return None

    def force_flush(self, *args, **kwargs) -> bool:  # type: ignore[override]
        return True


def _resolve_endpoint() -> Optional[str]:
    endpoint = os.getenv("AUTOPAL_OTLP_ENDPOINT") or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if endpoint:
        return endpoint.rstrip("/")
    if os.getenv("AUTOPAL_ENABLE_DEFAULT_OTLP", "false").lower() in {"1", "true", "yes"}:
        return _DEFAULT_ENDPOINT
    return None


def configure_observability(app: FastAPI, *, service_version: Optional[str] = None) -> None:
    """Configure OpenTelemetry tracing and metrics for ``app``."""

    global _CONFIGURED
    if _CONFIGURED:
        # ``FastAPIInstrumentor`` guards against double instrumentation and
        # ensures request spans are generated for any additional app instances
        # created in tests.
        FastAPIInstrumentor.instrument_app(app)
        return

    with _LOCK:
        if _CONFIGURED:
            FastAPIInstrumentor.instrument_app(app)
            return

        service_name = os.getenv("AUTOPAL_SERVICE_NAME", "autopal-fastapi")
        resource = Resource.create(
            {
                SERVICE_NAME: service_name,
                SERVICE_VERSION: service_version or app.version or "unknown",
                "deployment.environment": os.getenv("AUTOPAL_ENVIRONMENT", "development"),
            }
        )

        endpoint = _resolve_endpoint()
        console_requested = os.getenv("AUTOPAL_ENABLE_CONSOLE_EXPORTERS", "false").lower() in {
            "1",
            "true",
            "yes",
        }
        if endpoint:
            span_exporter = OTLPSpanExporter(endpoint=f"{endpoint}/v1/traces")
            metric_exporter = OTLPMetricExporter(endpoint=f"{endpoint}/v1/metrics")
        elif console_requested:
            span_exporter = ConsoleSpanExporter()
            metric_exporter = ConsoleMetricExporter()
        else:
            span_exporter = _NoOpSpanExporter()
            metric_exporter = _NoOpMetricExporter()

        tracer_provider = TracerProvider(resource=resource)
        tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
        trace.set_tracer_provider(tracer_provider)

        metric_reader = PeriodicExportingMetricReader(metric_exporter)
        meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
        metrics.set_meter_provider(meter_provider)

        FastAPIInstrumentor.instrument_app(app, tracer_provider=tracer_provider)
        _CONFIGURED = True
