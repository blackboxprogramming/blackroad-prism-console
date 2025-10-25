"""HubSpot connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase


class HubSpotConnector(ConnectorBase):
    name = "HubSpot"
    token_env_var = "HUBSPOT_ACCESS_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {"Authorization": f"Bearer {token}"}
        account = self._request_with_retries(
            "GET", "https://api.hubapi.com/account-info/v3/details", headers=headers
        )
        account_name = account.get("name") or account.get("portalId") or "HubSpot Account"
        deals = self._request_with_retries(
            "GET",
            "https://api.hubapi.com/crm/v3/objects/deals",
            headers=headers,
            params={"limit": 100, "archived": "false"},
        )
        active_deals = len(deals.get("results", []))
        return account_name, active_deals


__all__ = ["HubSpotConnector"]
