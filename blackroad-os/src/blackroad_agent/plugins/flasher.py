"""Placeholder flash plugin."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Dict

from .base import AgentPlugin


class Plugin(AgentPlugin):
    async def start(self) -> None:  # pragma: no cover - trivial
        pass

    async def stop(self) -> None:  # pragma: no cover - trivial
        pass

    async def execute(self, action_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        image = Path(payload["image_path"]).expanduser()
        target = payload["target_device"]
        workspace = Path(self.options.get("workspace", "/tmp/blackroad-flasher"))
        workspace.mkdir(parents=True, exist_ok=True)
        await asyncio.sleep(0.1)
        return {
            "status": "ok",
            "image": str(image),
            "target": target,
            "workspace": str(workspace),
        }
