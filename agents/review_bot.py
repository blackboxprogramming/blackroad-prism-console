"""Bot for requesting GitHub code reviews."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import List, Optional
import requests


@dataclass
class ReviewBot:
    """Automate requesting reviews on pull requests."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def request_review(self, pr_number: int, reviewers: List[str]) -> dict:
        """Request reviews from the specified users."""
        url = (
            f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}/requested_reviewers"
        )
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"reviewers": reviewers}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("ReviewBot ready to request reviews.")
