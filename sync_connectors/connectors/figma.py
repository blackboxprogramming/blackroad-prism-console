"""Figma connector implementation."""
from __future__ import annotations

import os
from typing import Optional

from .base import ConnectorBase, ConnectorError


class FigmaConnector(ConnectorBase):
    name = "Figma"
    token_env_var = "FIGMA_ACCESS_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        team_id = os.getenv("FIGMA_TEAM_ID")
        if not team_id:
            raise ConnectorError("Environment variable FIGMA_TEAM_ID is not set.")
        headers = {"X-Figma-Token": token}
        profile = self._request_with_retries(
            "GET", "https://api.figma.com/v1/me", headers=headers
        )
        account_name = profile.get("handle") or profile.get("email") or "Figma User"
        projects = self._request_with_retries(
            "GET",
            f"https://api.figma.com/v1/teams/{team_id}/projects",
            headers=headers,
        )
        active_projects = len(projects.get("projects", []))
        return account_name, active_projects


__all__ = ["FigmaConnector"]
