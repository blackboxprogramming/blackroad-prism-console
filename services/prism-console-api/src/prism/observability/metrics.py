from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram, REGISTRY

REQUEST_COUNT = Counter(
    "prism_requests_total",
    "Count of HTTP requests",
    labelnames=("route", "method", "status"),
)
REQUEST_LATENCY = Histogram(
    "prism_request_duration_seconds",
    "Latency of HTTP requests",
    labelnames=("route", "method"),
)
SSE_CLIENTS = Gauge(
    "prism_sse_clients",
    "Number of active SSE clients",
    labelnames=("route",),
)
RUNBOOK_EXECUTIONS = Counter(
    "prism_runbook_exec_total",
    "Runbook execution results",
    labelnames=("runbook_id", "status"),
)
AUTH_CACHE_HITS = Counter(
    "prism_auth_cache_hits_total",
    "Count of auth cache hits",
)

__all__ = [
    "REQUEST_COUNT",
    "REQUEST_LATENCY",
    "SSE_CLIENTS",
    "RUNBOOK_EXECUTIONS",
    "AUTH_CACHE_HITS",
    "REGISTRY",
]
