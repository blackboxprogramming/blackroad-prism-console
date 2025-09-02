"""Bot for automating GitHub milestone management."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class MilestoneBot:
    """Create and close GitHub milestones."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def create_milestone(self, title: str, description: str = "") -> dict:
        """Create a new milestone."""
        url = f"https://api.github.com/repos/{self.repo}/milestones"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"title": title, "description": description}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def close_milestone(self, milestone_number: int) -> dict:
        """Close an existing milestone."""
        url = f"https://api.github.com/repos/{self.repo}/milestones/{milestone_number}"
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
    print("MilestoneBot ready to manage milestones.")
