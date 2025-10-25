"""Linear connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase, ConnectorError


class LinearConnector(ConnectorBase):
    name = "Linear"
    token_env_var = "LINEAR_API_KEY"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {
            "Authorization": token,
            "Content-Type": "application/json",
        }
        query = (
            "query LinearTeams($after: String) {"
            " viewer { name displayName }"
            " teams(first: 50, after: $after) {"
            "   nodes { id name archivedAt }"
            "   pageInfo { hasNextPage endCursor }"
            " }"
            "}"
        )
        active_count = 0
        account_name: Optional[str] = None
        cursor: Optional[str] = None
        while True:
            payload = {"query": query, "variables": {"after": cursor}}
            response = self._request_with_retries(
                "POST",
                "https://api.linear.app/graphql",
                headers=headers,
                json=payload,
            )
            if "errors" in response:
                raise ConnectorError(str(response["errors"]))
            viewer = response.get("data", {}).get("viewer", {})
            account_name = (
                viewer.get("name")
                or viewer.get("displayName")
                or account_name
                or "Linear User"
            )
            teams = response.get("data", {}).get("teams", {})
            nodes = teams.get("nodes", [])
            active_count += sum(1 for node in nodes if not node.get("archivedAt"))
            page_info = teams.get("pageInfo", {})
            if page_info.get("hasNextPage"):
                cursor = page_info.get("endCursor")
            else:
                break
        if account_name is None:
            account_name = "Linear User"
        return account_name, active_count


__all__ = ["LinearConnector"]
