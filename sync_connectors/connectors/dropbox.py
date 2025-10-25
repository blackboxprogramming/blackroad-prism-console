"""Dropbox connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase


class DropboxConnector(ConnectorBase):
    name = "Dropbox"
    token_env_var = "DROPBOX_ACCESS_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        account = self._request_with_retries(
            "POST",
            "https://api.dropboxapi.com/2/users/get_current_account",
            headers=headers,
            json={},
        )
        account_name = account.get("name", {}).get("display_name") or "Dropbox User"
        payload = {"limit": 200}
        active_folders = 0
        response = self._request_with_retries(
            "POST",
            "https://api.dropboxapi.com/2/sharing/list_folders",
            headers=headers,
            json=payload,
        )
        active_folders += len(response.get("entries", []))
        cursor = response.get("cursor")
        while response.get("has_more") and cursor:
            response = self._request_with_retries(
                "POST",
                "https://api.dropboxapi.com/2/sharing/list_folders/continue",
                headers=headers,
                json={"cursor": cursor},
            )
            active_folders += len(response.get("entries", []))
            cursor = response.get("cursor")
        return account_name, active_folders


__all__ = ["DropboxConnector"]
