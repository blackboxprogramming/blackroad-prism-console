"""Configuration dataclasses for the BlackRoad agent runtime."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class PluginMount:
    """Represents a plugin mount point in the agent workspace."""

    name: str
    module: str
    enabled: bool = True
    config: Dict[str, object] = field(default_factory=dict)


@dataclass
class AgentConfig:
    """Top-level configuration for instantiating an agent runtime."""

    name: str
    persona: str
    workspace_root: Path
    mounts: List[PluginMount] = field(default_factory=list)
    default_model: Optional[str] = None
    notes: Optional[str] = None

    def enabled_mounts(self) -> List[PluginMount]:
        """Return only the mounts that should be activated at startup."""

        return [mount for mount in self.mounts if mount.enabled]
