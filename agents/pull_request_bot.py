"""Bot for automating GitHub pull request updates."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class PullRequestBot:
    """Automate creation and updating of GitHub pull requests."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def update_pull_request(self, pr_number: int, title: str | None = None, body: str | None = None) -> dict:
        """Update the title or body of an existing pull request."""
        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload: dict[str, str] = {}
        if title is not None:
            payload["title"] = title
        if body is not None:
            payload["body"] = body
        response = requests.patch(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def create_pull_request(self, title: str, head: str, base: str, body: str = "") -> dict:
        """Create a new pull request on GitHub."""
        url = f"https://api.github.com/repos/{self.repo}/pulls"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"title": title, "head": head, "base": base, "body": body}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("PullRequestBot ready to manage pull requests.")
