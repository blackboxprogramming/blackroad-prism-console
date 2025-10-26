from functools import lru_cache
from typing import List

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="roadview_", env_file=".env", case_sensitive=False)

    port: int = 4001
    env: str = "dev"
    log_level: str = "info"
    db_url: str = "sqlite+aiosqlite:///./data/roadview.db"
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])
    weight_text: float = 0.55
    weight_domain: float = 0.25
    weight_recency: float = 0.15
    weight_structure: float = 0.05
    metrics_enabled: bool = True
    crawler_enabled: bool = False
    crawler_user_agent: str = "BlackRoadRoadView/1.0 (+https://blackroad.io)"
    crawler_max_concurrency: int = 4
    rate_limit_per_minute: int = 120
    max_results: int = 100
    default_page_size: int = 25
    max_page_size: int = 100


class BiasNormalizationConfig(BaseModel):
    keywords: List[str] = Field(
        default_factory=lambda: [
            "left", "right", "liberal", "conservative", "progressive", "socialist", "capitalist",
            "centrist", "moderate", "libertarian", "nationalist",
        ]
    )
    recency_bonus: float = 0.02


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_bias_normalization() -> BiasNormalizationConfig:
    return BiasNormalizationConfig()
