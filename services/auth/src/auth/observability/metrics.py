from __future__ import annotations

from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "auth_requests_total",
    "Total number of requests",
    labelnames=("route", "method", "status"),
)

REQUEST_DURATION = Histogram(
    "auth_request_duration_seconds",
    "Request duration in seconds",
    labelnames=("route",),
)

RATE_LIMIT_BLOCK_TOTAL = Counter(
    "auth_rate_limit_block_total",
    "Total number of rate limited requests",
    labelnames=("route",),
)
