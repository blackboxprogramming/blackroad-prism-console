from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic import AnyUrl, BaseSettings, Field, validator


class Settings(BaseSettings):
    """Application configuration derived from environment variables."""

    port: int = Field(8082, env="AUTH_PORT")
    environment: str = Field("dev", env="AUTH_ENV")
    log_level: str = Field("info", env="AUTH_LOG_LEVEL")

    jwt_algorithm: str = Field("HS256", env="AUTH_JWT_ALG")
    jwt_issuer: str = Field("https://auth.blackroad.local", env="AUTH_JWT_ISS")
    jwt_access_ttl_minutes: int = Field(15, env="AUTH_JWT_ACCESS_TTL_MIN")
    jwt_refresh_ttl_days: int = Field(7, env="AUTH_JWT_REFRESH_TTL_DAYS")
    jwt_hs_secret: Optional[str] = Field(None, env="AUTH_JWT_HS_SECRET")
    jwt_private_key_path: Optional[str] = Field(None, env="AUTH_JWT_PRIVATE_KEY_PATH")
    jwt_public_key_path: Optional[str] = Field(None, env="AUTH_JWT_PUBLIC_KEY_PATH")

    rate_limit_rpm: int = Field(120, env="AUTH_RATE_LIMIT_RPM")

    database_url: str = Field("sqlite+aiosqlite:///./data/auth.db", env="AUTH_DB_URL")

    cors_origins: str = Field("http://localhost:3000,https://console.blackroad.io", env="AUTH_CORS_ORIGINS")

    metrics_enabled: bool = Field(True, env="METRICS_ENABLED")

    admin_rotation_enabled: bool = Field(False, env="AUTH_ADMIN_ROTATION_ENABLED")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("cors_origins")
    def parse_origins(cls, value: str) -> str:
        return value or ""

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
