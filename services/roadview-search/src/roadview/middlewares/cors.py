from __future__ import annotations

from fastapi.middleware.cors import CORSMiddleware

from ..config import get_settings

settings = get_settings()


def apply_cors(app) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
