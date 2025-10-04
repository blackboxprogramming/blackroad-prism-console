"""Configuration loader for the Autopal emergency access service."""

from __future__ import annotations

import copy
import json
import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Literal

from pydantic import BaseModel, Field, validator


class FeatureFlags(BaseModel):
    """Runtime switches that gate Autopal behaviour."""

    global_enabled: bool = Field(True, description="When false, normal traffic is blocked without break-glass")
    require_step_up: bool = Field(
        True,
        description="When true, the X-Step-Up-Approved header is required for sensitive endpoints.",
    )


class BreakGlassConfig(BaseModel):
    """Settings governing break-glass JWT admission."""

    enabled: bool = True
    alg: str = Field("HS256", description="JWT signing algorithm")
    hmac_secret_env: str = Field(
        "AUTOPAL_BREAK_GLASS_SECRET",
        description="Environment variable containing the HMAC secret",
    )
    ttl_seconds: int = Field(600, gt=0, description="Maximum allowed lifetime for break-glass tokens")
    allowlist_endpoints: list[str] = Field(default_factory=list)
    allowed_subjects: list[str] = Field(default_factory=list)

    @validator("allowlist_endpoints", each_item=True)
    def _validate_allowlist_entry(cls, value: str) -> str:  # noqa: D401
        """Ensure allowlist entries follow the "METHOD /path" format."""

        if " " not in value:
            raise ValueError("allowlist entries must be of form 'METHOD /path'")
        method, path = value.split(" ", 1)
        if not method or not path.startswith("/"):
            raise ValueError("allowlist entries must include an HTTP verb and absolute path")
        return f"{method.upper()} {path}"

    @validator("allowed_subjects", each_item=True)
    def _strip_subject(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("allowed subjects cannot be empty")
        return cleaned


class AuditConfig(BaseModel):
    """Audit emission configuration."""

    enabled: bool = True
    sink: Literal["stdout"] = "stdout"
    redact_values: bool = True


class AppConfig(BaseModel):
    """Top-level configuration object."""

    feature_flags: FeatureFlags = Field(default_factory=FeatureFlags)
    break_glass: BreakGlassConfig
    audit: AuditConfig = Field(default_factory=AuditConfig)


@dataclass
class _CachedConfig:
    signature: tuple[int, int] | None
    config: AppConfig | None


class ConfigLoader:
    """Load Autopal configuration with lightweight change detection."""

    def __init__(self, path: str | os.PathLike[str] | None = None) -> None:
        default_path = Path.cwd() / "autopal.config.json"
        resolved_path = Path(path or os.getenv("AUTOPAL_CONFIG_PATH") or default_path)
        self._path = resolved_path
        self._cache = _CachedConfig(signature=None, config=None)
        self._lock = Lock()

    @property
    def path(self) -> Path:
        return self._path

    def get(self) -> AppConfig:
        """Return the current configuration, reloading if the file changed."""

        try:
            stat_result = self._path.stat()
        except FileNotFoundError as exc:  # pragma: no cover - defensive guard
            raise RuntimeError(f"Autopal config not found at {self._path}") from exc

        signature = (stat_result.st_mtime_ns, stat_result.st_size)
        with self._lock:
            if self._cache.signature != signature or self._cache.config is None:
                self._cache = _CachedConfig(signature=signature, config=self._load())
            # Return a deepcopy so request handlers can't mutate shared config
            return copy.deepcopy(self._cache.config)

    def _load(self) -> AppConfig:
        data = json.loads(self._path.read_text())
        model_validate = getattr(AppConfig, "model_validate", None)
        if callable(model_validate):
            return model_validate(data)
        return AppConfig.parse_obj(data)  # type: ignore[attr-defined]


config_loader = ConfigLoader()

__all__ = [
    "AppConfig",
    "AuditConfig",
    "BreakGlassConfig",
    "ConfigLoader",
    "FeatureFlags",
    "config_loader",
]
