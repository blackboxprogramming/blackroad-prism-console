from __future__ import annotations

from typing import Any, Dict, Protocol


class Connector(Protocol):
    name: str

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        ...


__all__ = ["Connector"]

