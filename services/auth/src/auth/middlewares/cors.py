from __future__ import annotations

from fastapi.middleware.cors import CORSMiddleware

from ..config import Settings


def setup_cors(app, settings: Settings) -> None:
    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
