from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    port: int = Field(4001, alias="ROADVIEW_PORT")
    env: str = Field("dev", alias="ROADVIEW_ENV")
    log_level: str = Field("info", alias="ROADVIEW_LOG_LEVEL")

    db_url: str = Field("sqlite+aiosqlite:///./data/roadview.db", alias="ROADVIEW_DB_URL")

    weight_text: float = Field(0.55, alias="WEIGHT_TEXT")
    weight_domain: float = Field(0.25, alias="WEIGHT_DOMAIN")
    weight_recency: float = Field(0.15, alias="WEIGHT_RECENCY")
    weight_structure: float = Field(0.05, alias="WEIGHT_STRUCTURE")

    cors_origins_raw: str = Field(
        "http://localhost:3000,https://console.blackroad.io",
        alias="ROADVIEW_CORS_ORIGINS",
    )

    metrics_enabled: bool = Field(True, alias="METRICS_ENABLED")

    crawler_enabled: bool = Field(False, alias="CRAWLER_ENABLED")
    crawler_user_agent: str = Field(
        "BlackRoadRoadView/1.0 (+https://blackroad.io)", alias="CRAWLER_USER_AGENT"
    )
    crawler_max_concurrency: int = Field(4, alias="CRAWLER_MAX_CONCURRENCY")

    rate_limit_per_minute: int = Field(120, alias="ROADVIEW_RATE_LIMIT")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "case_sensitive": False,
    }

    @field_validator("cors_origins_raw", mode="before")
    @classmethod
    def _normalize_origins(cls, value: str) -> str:
        return ",".join([origin.strip() for origin in str(value).split(",") if origin.strip()])

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
