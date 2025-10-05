"""Configuration loading for the Autopal FastAPI service."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError


class RateLimitConfig(BaseModel):
    """Window based rate limit configuration."""

    limit: int = Field(..., gt=0)
    window_seconds: int = Field(..., gt=0)


class EndpointPolicy(BaseModel):
    """Security policy for a single endpoint."""

    required_audience: List[str] = Field(default_factory=list)
    step_up_required: bool = False
    dual_control_required: bool = False
    rate_limit: Optional[RateLimitConfig] = None


class AppConfig(BaseModel):
    """Top level application configuration."""

    global_enabled: bool = True
    dual_control_timeout_seconds: int = Field(600, gt=0)
    endpoints: Dict[str, EndpointPolicy] = Field(default_factory=dict)

    def policy_for(self, path: str) -> EndpointPolicy:
        """Return the policy for a given path if defined, otherwise an empty policy."""

        return self.endpoints.get(path, EndpointPolicy())


class ConfigError(RuntimeError):
    """Raised when configuration cannot be loaded."""


def load_config(path: Path) -> AppConfig:
    """Load and validate configuration from ``path``."""

    try:
        data = json.loads(path.read_text())
    except FileNotFoundError as exc:  # pragma: no cover - explicit messaging
        raise ConfigError(f"Configuration file not found: {path}") from exc
    except json.JSONDecodeError as exc:  # pragma: no cover - explicit messaging
        raise ConfigError(f"Invalid JSON configuration: {exc}") from exc

    try:
        return AppConfig.model_validate(data)
    except ValidationError as exc:  # pragma: no cover - explicit messaging
        raise ConfigError(f"Invalid configuration: {exc}") from exc
