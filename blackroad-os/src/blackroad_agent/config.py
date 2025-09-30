"""Configuration models and helpers for the BlackRoad agent."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
import yaml


class TransportConfig(BaseModel):
    """Configuration for a transport the agent should bring online."""

    type: str = Field(..., description="Transport type identifier (http, mqtt, etc.)")
    listen: Optional[str] = Field(None, description="Address for listeners (HTTP, gRPC, etc.)")
    broker: Optional[str] = Field(None, description="Broker URI for message transports")
    options: Dict[str, Any] = Field(default_factory=dict, description="Transport-specific options")


class PluginConfig(BaseModel):
    """Configuration for a plugin entry declared in the manifest."""

    name: str
    module: str
    options: Dict[str, Any] = Field(default_factory=dict)


class AgentConfig(BaseModel):
    """Top-level agent configuration as loaded from YAML."""

    node_name: str
    data_dir: Path
    transports: List[TransportConfig] = Field(default_factory=list)
    plugins: List[PluginConfig] = Field(default_factory=list)

    @field_validator("data_dir", mode="before")
    def _expand_data_dir(cls, value: Any) -> Path:
        return Path(value).expanduser() if value else Path("~/.blackroad").expanduser()


class ManifestConfig(BaseModel):
    """References to additional manifests the agent consumes."""

    actions: Path

    @field_validator("actions", mode="before")
    def _expand_path(cls, value: Any) -> Path:
        return Path(value)


class Settings(BaseModel):
    """Full configuration object combining agent and manifest settings."""

    agent: AgentConfig
    manifests: ManifestConfig

    def ensure_directories(self) -> None:
        """Create directories the agent requires if they are missing."""

        self.agent.data_dir.mkdir(parents=True, exist_ok=True)


def load_settings(path: Path) -> Settings:
    """Load configuration from a YAML file."""

    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    settings = Settings.model_validate(data)
    settings.ensure_directories()
    return settings
