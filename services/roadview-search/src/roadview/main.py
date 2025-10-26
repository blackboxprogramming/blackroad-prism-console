from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI

from .config import get_settings
from .middlewares.cors import configure_cors
from .middlewares.rate_limit import RateLimitMiddleware
from .middlewares.request_id import RequestIdMiddleware
from .middlewares.security_headers import SecurityHeadersMiddleware
from .observability.logging import configure_logging
from .repo import RoadviewRepository, create_repository
from .routes import ingest, meta, search
from .services.tokenizer import Tokenizer

settings = get_settings()
configure_logging(settings.log_level)

tokenizer = Tokenizer()
repository: RoadviewRepository = create_repository(settings.db_url, tokenizer)

app = FastAPI(title="RoadView Search Service", version="0.1.0")


@app.on_event("startup")
async def startup() -> None:
    app.state.start_time = time.time()
    app.state.repository = repository
    app.state.tokenizer = tokenizer
    fixtures_path = Path(__file__).resolve().parents[2] / "fixtures" / "curated_seed.json"
    app.state.curated_seed_path = fixtures_path
    await repository.init_db()


configure_cors(app, settings.cors_origins)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)

app.include_router(search.router)
app.include_router(ingest.router)
app.include_router(meta.router)
