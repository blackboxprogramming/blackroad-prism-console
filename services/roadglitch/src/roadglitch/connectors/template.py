from __future__ import annotations

from typing import Any, Dict


class TemplateConnector:
    """Example connector template showing the required interface."""

    name = "connector.template.echo"

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        message = params.get("message", "")
        return {"echo": message, "context": context.get("run_id")}


__all__ = ["TemplateConnector"]

