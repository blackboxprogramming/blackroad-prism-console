from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Generator

from prometheus_client import Counter, Gauge, Histogram

from ..config import get_settings

settings = get_settings()

RUNS_TOTAL = Counter(
    "roadglitch_runs_total",
    "Total workflow runs",
    labelnames=("status",),
)

RUN_DURATION = Histogram(
    "roadglitch_run_duration_seconds",
    "Run duration in seconds",
    labelnames=("status",),
)

NODE_DURATION = Histogram(
    "roadglitch_node_duration_seconds",
    "Node execution duration",
    labelnames=("connector", "status"),
)

QUEUE_DEPTH = Gauge(
    "roadglitch_queue_depth",
    "Current queue depth",
)

NODE_STARTED = Counter(
    "roadglitch_node_events_total",
    "Node start/finish events",
    labelnames=("connector", "status"),
)


@contextmanager
def observe_run(status: str) -> Generator[None, None, None]:
    start = time.monotonic()
    try:
        yield
    finally:
        duration = time.monotonic() - start
        RUNS_TOTAL.labels(status=status).inc()
        RUN_DURATION.labels(status=status).observe(duration)


@contextmanager
def observe_node(connector: str, status: str) -> Generator[None, None, None]:
    start = time.monotonic()
    NODE_STARTED.labels(connector=connector, status=status).inc()
    try:
        yield
    finally:
        duration = time.monotonic() - start
        NODE_DURATION.labels(connector=connector, status=status).observe(duration)


__all__ = [
    "RUNS_TOTAL",
    "RUN_DURATION",
    "NODE_DURATION",
    "QUEUE_DEPTH",
    "NODE_STARTED",
    "observe_run",
    "observe_node",
]

