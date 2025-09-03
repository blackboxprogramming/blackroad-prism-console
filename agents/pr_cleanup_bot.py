"""Bot for closing stale GitHub pull requests."""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import requests


@dataclass
class PullRequestCleanupBot:
    """Close stale pull requests in a repository.

    Attributes:
        repo: Repository in ``owner/name`` format.
        token: GitHub token with repo scope. Uses ``GITHUB_TOKEN`` env var if omitted.
        days: Pull requests with no updates for this many days are considered stale.
    """

    repo: str
    token: Optional[str] = None
    days: int = 30

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def _headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    def get_open_pull_requests(self) -> List[dict]:
        """Return all open pull requests for the repository."""
        url = f"https://api.github.com/repos/{self.repo}/pulls?state=open"
        response = requests.get(url, headers=self._headers(), timeout=10)
        response.raise_for_status()
        return response.json()

    def close_pull_request(self, number: int) -> dict:
        """Close a pull request by number."""
        url = f"https://api.github.com/repos/{self.repo}/pulls/{number}"
        payload = {"state": "closed"}
        response = requests.patch(url, json=payload, headers=self._headers(), timeout=10)
        response.raise_for_status()
        return response.json()

    def close_stale_pull_requests(self) -> List[int]:
        """Close pull requests with no updates for ``days`` days."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.days)
        closed: List[int] = []
        for pr in self.get_open_pull_requests():
            updated = datetime.fromisoformat(pr["updated_at"].replace("Z", "+00:00"))
            if updated < cutoff:
                self.close_pull_request(pr["number"])
                closed.append(pr["number"])
        return closed


def main(argv: List[str] | None = None) -> int:
    """CLI entry point to close stale pull requests."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", help="Repository in owner/name format")
    parser.add_argument("--days", type=int, default=30, help="Days to consider stale")
    args = parser.parse_args(argv)
    bot = PullRequestCleanupBot(repo=args.repo, days=args.days)
    closed = bot.close_stale_pull_requests()
    for pr_number in closed:
        print(f"Closed pull request #{pr_number}")
    if not closed:
        print("No stale pull requests found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
