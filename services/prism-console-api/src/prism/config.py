from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="PRISM_", case_sensitive=False)

    port: int = 4000
    env: str = "dev"
    log_level: str = "info"

    auth_base_url: str = "http://localhost:8082"
    auth_cache_ttl_ms: int = 60_000

    roadglitch_base_url: str = "http://localhost:8080"
    gateway_base_url: str | None = "http://localhost:8081"

    enable_sse: bool = True
    mock_mode: bool = True

    db_url: str = "sqlite:///./data/prism.db"

    metrics_enabled: bool = True

    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://console.blackroad.io",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_csv(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


__all__ = ["Settings", "get_settings"]
