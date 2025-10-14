"""Configuration primitives for the mining-ops lab service."""

from functools import lru_cache
from typing import List

from pydantic import Field, HttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    database_url: str = Field(
        "postgresql+asyncpg://postgres:postgres@localhost:5432/mining_ops_lab",
        description="Async SQLAlchemy connection string.",
    )
    redis_url: str = Field("redis://localhost:6379/0", description="Redis connection URI.")
    stripe_api_key: str = Field("", description="Stripe secret key for billing integration.")
    jwt_secret_key: str = Field(..., description="Secret used to sign JWT access tokens.")
    jwt_refresh_secret_key: str = Field(..., description="Secret used to sign refresh tokens.")
    telemetry_bucket_span_seconds: int = Field(
        10, description="Telemetry sampling window used by the sidecar agent."
    )
    allowed_image_regexes: List[str] = Field(
        default_factory=lambda: [
            r"^([a-z0-9]+[._-]?)+/(?:[a-z0-9._-]+)(?::[a-zA-Z0-9._-]+)?$",
            r"^(?:ghcr\.io|public\.ecr\.aws)/[\w][\w./-]*(?::[\w.-]+)?$",
        ],
        description="Regex allowlist applied to user-supplied container image URIs.",
    )
    max_runtime_minutes: int = Field(
        120, description="Absolute upper bound on job runtime enforced by the API."
    )
    minimum_budget_cap_usd: float = Field(0.5, description="Minimum allowed budget for a job.")
    enable_monte_carlo: bool = Field(True, description="Toggle Monte Carlo profitability modeling.")
    docs_url: HttpUrl | None = Field(
        None,
        description="Optional override for OpenAPI documentation host (useful behind proxies).",
    )

    model_config = SettingsConfigDict(env_prefix="MOL_", case_sensitive=False)

    @field_validator("allowed_image_regexes")
    @classmethod
    def _strip_empty(cls, values: List[str]) -> List[str]:
        return [value for value in values if value]


@lru_cache
def get_settings() -> AppSettings:
    """Return a cached instance of :class:`AppSettings`."""

    return AppSettings()
