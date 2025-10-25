"""FastAPI application with added health and metrics endpoints.

This module provides a simple FastAPI app similar to the Autopal Controls API
but with additional `/health` and `/metrics` routes. The `/health` route
returns a JSON document with the service status, uptime, version, and the
number of loaded models. The `/metrics` route exposes Prometheus-formatted
metrics for scraping. These changes illustrate how you can wire
observability into your own application.
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI
from fastapi.responses import Response, JSONResponse
from prometheus_client import (
    CollectorRegistry,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

# Capture the time when the application starts. Used to calculate uptime.
startup_time = time.time()

# Set up a dedicated Prometheus registry and metrics. Using a custom
# registry avoids conflicts if your process contains other instruments.
registry = CollectorRegistry()
uptime_gauge = Gauge(
    "autopal_uptime_seconds",
    "Uptime of the Autopal application in seconds",
    registry=registry,
)
models_loaded_gauge = Gauge(
    "autopal_models_loaded",
    "Number of machine-learning models currently loaded",
    registry=registry,
)


def create_app() -> FastAPI:
    """
    Instantiate a FastAPI application with health and metrics routes.

    Returns
    -------
    FastAPI
        Configured FastAPI application instance.
    """
    app = FastAPI(title="Autopal Controls API", version="1.0.0")

    # Place to store the number of loaded models. Real applications should
    # update this value when models are loaded/unloaded.
    app.state.models_loaded = getattr(app.state, "models_loaded", 0)

    @app.get("/health/live")
    async def live() -> dict[str, str]:
        """Liveness probe: indicates that the service is up."""
        return {"status": "live"}

    @app.get("/health/ready")
    async def ready() -> dict[str, str]:
        """Readiness probe: indicates the service is ready to accept traffic."""
        return {"status": "ready"}

    @app.get("/health")
    async def health() -> dict[str, Any]:
        """
        Aggregate health endpoint providing human-readable status.

        Returns a JSON document that includes the current status (always
        "ok" if reachable), the uptime in seconds, the semantic version
        string reported by the FastAPI instance, and the number of models
        currently loaded. For real-world use, update `models_loaded` via
        `app.state.models_loaded` as part of your model loading routine.
        """
        uptime_seconds = time.time() - startup_time
        models_loaded = getattr(app.state, "models_loaded", 0)
        return {
            "status": "ok",
            "uptime_seconds": uptime_seconds,
            "version": app.version,
            "models_loaded": models_loaded,
        }

    @app.get("/metrics")
    async def metrics() -> Response:
        """
        Expose Prometheus metrics for scraping.

        This endpoint updates the uptime and loaded-model gauges and then
        returns all metrics from the custom registry in the Prometheus
        exposition format. Monitoring systems like Prometheus can scrape
        this URL to collect telemetry about the application.
        """
        uptime_gauge.set(time.time() - startup_time)
        models_loaded_gauge.set(getattr(app.state, "models_loaded", 0))
        payload = generate_latest(registry)
        return Response(payload, media_type=CONTENT_TYPE_LATEST)

    return app


# Create a module-level app so frameworks like Uvicorn can discover it.
app = create_app()
