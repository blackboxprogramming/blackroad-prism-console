"""GitHub connector implementation."""
from __future__ import annotations

from typing import Optional

from .base import ConnectorBase


class GitHubConnector(ConnectorBase):
    name = "GitHub"
    token_env_var = "GITHUB_TOKEN"

    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        }
        user = self._request_with_retries(
            "GET", "https://api.github.com/user", headers=headers
        )
        account_name = user.get("name") or user.get("login") or "GitHub User"
        repos = self._request_with_retries(
            "GET",
            "https://api.github.com/user/repos",
            headers=headers,
            params={"per_page": 100, "type": "owner"},
        )
        active_count = sum(1 for repo in repos if not repo.get("archived"))
        return account_name, active_count


__all__ = ["GitHubConnector"]
