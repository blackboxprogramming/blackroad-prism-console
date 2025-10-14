"""Entry-point helper for running the AutoPal service locally."""

from __future__ import annotations

import uvicorn

from .config import settings


def main() -> None:
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        factory=False,
    )


if __name__ == "__main__":
    main()
