"""Notion connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase, ConnectorError


class NotionConnector(ConnectorBase):
    name = "Notion"
    token_env_var = "NOTION_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        try:
            from notion_client import Client
        except ImportError as exc:  # pragma: no cover - defensive
            raise ConnectorError("notion-client package is required for Notion") from exc

        client = Client(auth=token)
        user = client.users.me()
        account_name = (
            user.get("name")
            or user.get("email")
            or user.get("bot")
            or "Notion Integration"
        )
        active_databases = 0
        cursor: Optional[str] = None
        while True:
            response = client.search(
                filter={"property": "object", "value": "database"},
                start_cursor=cursor,
                page_size=100,
            )
            active_databases += len(response.get("results", []))
            if not response.get("has_more"):
                break
            cursor = response.get("next_cursor")
        return account_name, active_databases


__all__ = ["NotionConnector"]
