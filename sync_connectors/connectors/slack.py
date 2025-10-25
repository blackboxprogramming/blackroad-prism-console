"""Slack connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase, ConnectorError


class SlackConnector(ConnectorBase):
    name = "Slack"
    token_env_var = "SLACK_BOT_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {"Authorization": f"Bearer {token}"}
        auth_test = self._request_with_retries(
            "POST", "https://slack.com/api/auth.test", headers=headers
        )
        if not auth_test.get("ok"):
            raise ConnectorError(auth_test.get("error", "Unknown Slack error"))
        team_name = auth_test.get("team") or "Slack Workspace"
        cursor: Optional[str] = None
        active_channels = 0
        while True:
            params = {
                "limit": 200,
                "types": "public_channel,private_channel",
            }
            if cursor:
                params["cursor"] = cursor
            response = self._request_with_retries(
                "GET",
                "https://slack.com/api/conversations.list",
                headers=headers,
                params=params,
            )
            if not response.get("ok"):
                raise ConnectorError(response.get("error", "Failed to list channels"))
            channels = response.get("channels", [])
            active_channels += sum(1 for channel in channels if not channel.get("is_archived"))
            cursor = response.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break
        return team_name, active_channels


__all__ = ["SlackConnector"]
