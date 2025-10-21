"""Entrypoint for running the mining-ops lab FastAPI service."""

import uvicorn

from . import create_app
from .config import AppSettings

app = create_app()


@app.on_event("startup")
async def startup_event() -> None:
    """Load configuration and warm up shared resources."""
    settings = AppSettings()  # noqa: F841 - ensures validation on boot


if __name__ == "__main__":  # pragma: no cover - CLI helper
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
