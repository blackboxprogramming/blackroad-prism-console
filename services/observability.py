"""Utilities for service-level observability surfaces.

This module provides helper classes used by the Python services to expose
structured dependency information and Prometheus-compatible metrics.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Mapping

_PROMETHEUS_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"


@dataclass(frozen=True)
class DependencyStatus:
    """Simple value object describing a dependency state."""

    status: str
    detail: str | None = None

    def is_healthy(self) -> bool:
        """Return ``True`` when the dependency should be considered healthy."""

        return self.status in {"ok", "disabled"}

    @classmethod
    def ok(cls, detail: str | None = None) -> "DependencyStatus":
        return cls("ok", detail)

    @classmethod
    def degraded(cls, detail: str | None = None) -> "DependencyStatus":
        return cls("degraded", detail)

    @classmethod
    def error(cls, detail: str | None = None) -> "DependencyStatus":
        return cls("error", detail)

    @classmethod
    def disabled(cls, detail: str | None = None) -> "DependencyStatus":
        return cls("disabled", detail)


class DependencyRecorder:
    """Track dependency health and expose Prometheus gauge metrics."""

    def __init__(self, service: str) -> None:
        self._service = service
        self._values: Dict[str, float] = {}
        self._lock = Lock()

    def snapshot(self, statuses: Mapping[str, DependencyStatus]) -> Dict[str, object]:
        """Capture the provided statuses and return a JSON-friendly payload."""

        now = datetime.now(timezone.utc).isoformat()
        dependencies: Dict[str, Dict[str, str]] = {}
        metrics: Dict[str, float] = {}
        overall = "ok"

        for name, state in sorted(statuses.items()):
            dependencies[name] = {"status": state.status}
            if state.detail:
                dependencies[name]["detail"] = state.detail
            if not state.is_healthy():
                overall = "degraded"
            metrics[name] = 1.0 if state.is_healthy() else 0.0

        with self._lock:
            self._values = metrics

        return {
            "service": self._service,
            "status": overall,
            "observed_at": now,
            "dependencies": dependencies,
        }

    def render_prometheus(self) -> str:
        """Render the tracked dependency gauges in Prometheus exposition format."""

        with self._lock:
            metrics = self._values.copy()

        lines = [
            "# HELP service_dependency_up 1 indicates the dependency is healthy or intentionally disabled",
            "# TYPE service_dependency_up gauge",
        ]
        for dependency, value in sorted(metrics.items()):
            labels = f'service="{self._service}",dependency="{dependency}"'
            lines.append(f"service_dependency_up{{{labels}}} {value}")
        return "\n".join(lines) + "\n"

    @property
    def prometheus_content_type(self) -> str:
        """Content type advertised by Prometheus text exposition responses."""

        return _PROMETHEUS_CONTENT_TYPE


__all__ = ["DependencyRecorder", "DependencyStatus"]
