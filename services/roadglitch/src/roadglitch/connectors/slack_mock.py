from __future__ import annotations

from typing import Any, Dict

import structlog

logger = structlog.get_logger(__name__)


class SlackMockConnector:
    name = "connector.slack.postMessage"

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("slack_mock", channel=params.get("channel"), text=params.get("text"), context=context)
        return {"ok": True, "channel": params.get("channel")}


__all__ = ["SlackMockConnector"]

