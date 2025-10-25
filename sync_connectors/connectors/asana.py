"""Asana connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase


class AsanaConnector(ConnectorBase):
    name = "Asana"
    token_env_var = "ASANA_ACCESS_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {
            "Authorization": f"Bearer {token}",
        }
        user = self._request_with_retries(
            "GET", "https://app.asana.com/api/1.0/users/me", headers=headers
        )
        account_name = user.get("data", {}).get("name") or "Asana User"
        workspaces = self._request_with_retries(
            "GET", "https://app.asana.com/api/1.0/workspaces", headers=headers
        )
        active_workspaces = [
            workspace
            for workspace in workspaces.get("data", [])
            if not workspace.get("is_archived", False)
        ]
        return account_name, len(active_workspaces)


__all__ = ["AsanaConnector"]
