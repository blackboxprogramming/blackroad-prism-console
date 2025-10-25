from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import List, Sequence


@dataclass
class Settings:
    app_name: str = "RoadGlitch"
    port: int = 8080
    auth_token: str = "dev-token"
    mock_mode: bool = True
    allow_shell: bool = False
    redis_url: str | None = None
    cors_allow_origins: Sequence[str] = field(default_factory=lambda: ["*"])
    rate_limit_per_minute: int = 60
    database_url: str = field(
        default_factory=lambda: f"sqlite:///{Path('data').absolute() / 'roadglitch.db'}"
    )
    metrics_namespace: str = "roadglitch"
    connector_host_allowlist: List[str] = field(
        default_factory=lambda: ["127.0.0.1", "localhost", "*.blackroad.io"]
    )

    @classmethod
    def from_env(cls) -> "Settings":
        kwargs = {}
        for field_name in cls.__dataclass_fields__:
            env_key = f"ROADGLITCH_{field_name.upper()}"
            if env_key in os.environ:
                value = os.environ[env_key]
                field_type = cls.__dataclass_fields__[field_name].type
                if field_type is bool:
                    kwargs[field_name] = value.lower() in {"1", "true", "yes"}
                elif field_type is int:
                    kwargs[field_name] = int(value)
                elif field_type in (List[str], Sequence[str]):
                    kwargs[field_name] = [item.strip() for item in value.split(",") if item.strip()]
                else:
                    kwargs[field_name] = value
        return cls(**kwargs)


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()


__all__ = ["Settings", "get_settings"]

