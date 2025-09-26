"""Bot for merging GitHub pull requests."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class MergeBot:
    """Automate merging of pull requests when conditions are met."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def merge_pull_request(self, pr_number: int, commit_message: str | None = None) -> dict:
        """Merge a pull request using the GitHub API."""
        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}/merge"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload: dict[str, str] = {}
        if commit_message:
            payload["commit_message"] = commit_message
        response = requests.put(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("MergeBot ready to merge pull requests.")
