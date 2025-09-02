"""Bot for managing GitHub labels."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class LabelBot:
    """Automate adding or removing labels on issues and pull requests."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def add_labels(self, issue_number: int, labels: list[str]) -> dict:
        """Add labels to a GitHub issue or pull request."""
        url = f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/labels"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"labels": labels}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def remove_label(self, issue_number: int, label: str) -> None:
        """Remove a label from a GitHub issue or pull request."""
        url = (
            f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/labels/{label}"
        )
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        } if self.token else {"Accept": "application/vnd.github+json"}
        response = requests.delete(url, headers=headers, timeout=10)
        response.raise_for_status()


if __name__ == "__main__":
    print("LabelBot ready to manage labels.")
