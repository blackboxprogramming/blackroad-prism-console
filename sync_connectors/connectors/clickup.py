"""ClickUp connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase, ConnectorError


class ClickUpConnector(ConnectorBase):
    name = "ClickUp"
    token_env_var = "CLICKUP_API_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {"Authorization": token}
        teams_response = self._request_with_retries(
            "GET", "https://api.clickup.com/api/v2/team", headers=headers
        )
        teams = teams_response.get("teams", [])
        if not teams:
            raise ConnectorError("No teams available for ClickUp token.")
        account_name = teams[0].get("name") or "ClickUp Workspace"
        total_spaces = 0
        for team in teams:
            team_id = team.get("id")
            if not team_id:
                continue
            spaces = self._request_with_retries(
                "GET",
                f"https://api.clickup.com/api/v2/team/{team_id}/space",
                headers=headers,
                params={"archived": "false"},
            )
            total_spaces += len(spaces.get("spaces", []))
        return account_name, total_spaces


__all__ = ["ClickUpConnector"]
