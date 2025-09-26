"""Bot for automating GitHub issue creation and management."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class IssueBot:
    """Automate creation, listing, and closing of GitHub issues."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def create_issue(self, title: str, body: str = "") -> dict:
        """Create a new issue on GitHub."""
        url = f"https://api.github.com/repos/{self.repo}/issues"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"title": title, "body": body}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def list_issues(self, state: str = "open") -> list[dict]:
        """Retrieve issues from the repository.

        Args:
            state: Filter by issue state ("open", "closed", or "all").
        """
        url = f"https://api.github.com/repos/{self.repo}/issues"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        } if self.token else {"Accept": "application/vnd.github+json"}
        params = {"state": state}
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

    def close_issue(self, issue_number: int) -> dict:
        """Close an existing GitHub issue."""
        url = f"https://api.github.com/repos/{self.repo}/issues/{issue_number}"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"state": "closed"}
        response = requests.patch(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("IssueBot ready to manage issues.")
