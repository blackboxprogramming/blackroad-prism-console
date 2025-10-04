"""Telemetry bootstrap for the materials service."""

from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

_configured = False


def _build_exporter() -> BatchSpanProcessor:
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if endpoint:
        url = f"{endpoint.rstrip('/')}/v1/traces"
        exporter = OTLPSpanExporter(endpoint=url)
    else:
        exporter = ConsoleSpanExporter()
    return BatchSpanProcessor(exporter)


def configure_telemetry(app: FastAPI) -> Optional[TracerProvider]:
    """Configure OpenTelemetry for the given FastAPI app."""
    global _configured
    if _configured:
        return trace.get_tracer_provider()

    resource = Resource.create(
        {
            "service.name": os.getenv("OTEL_SERVICE_NAME", "lucidia-materials"),
            "service.version": os.getenv("BUILD_SHA", "dev"),
        }
    )
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(_build_exporter())
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)
    _configured = True
    return provider
