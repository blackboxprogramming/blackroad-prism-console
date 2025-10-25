"""Canva connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase, ConnectorError


class CanvaConnector(ConnectorBase):
    name = "Canva"
    token_env_var = "CANVA_API_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        account = self._request_with_retries(
            "GET", "https://api.canva.com/rest/v1/users/me", headers=headers
        )
        account_name = account.get("displayName") or account.get("email") or "Canva User"
        teams = self._request_with_retries(
            "GET", "https://api.canva.com/rest/v1/teams", headers=headers
        )
        entries = teams.get("teams", []) if isinstance(teams, dict) else []
        if not entries and isinstance(teams, list):
            entries = teams
        active_teams = len(entries)
        if active_teams == 0:
            raise ConnectorError("No teams returned from Canva API.")
        return account_name, active_teams


__all__ = ["CanvaConnector"]
