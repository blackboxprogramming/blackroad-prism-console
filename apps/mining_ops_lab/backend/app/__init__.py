"""Application factory for the mining-ops lab backend service."""

from fastapi import FastAPI

from .api.routes import compliance, jobs, scenarios, usage


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Mining Ops Lab API",
        version="0.1.0",
        description=(
            "APIs for modeling profitability, scheduling ephemeral test jobs, and"
            " enforcing compliance guardrails for user-supplied workloads."
        ),
    )

    app.include_router(scenarios.router, prefix="/scenarios", tags=["scenarios"])
    app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
    app.include_router(usage.router, prefix="/usage", tags=["usage"])
    app.include_router(compliance.router, prefix="/compliance", tags=["compliance"])

    return app
