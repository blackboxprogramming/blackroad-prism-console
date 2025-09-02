"""Bot for checking GitHub workflow run status."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class StatusBot:
    """Fetch status of GitHub Actions workflow runs."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def latest_status(self, workflow: str) -> str:
        """Return the status of the most recent workflow run."""
        url = f"https://api.github.com/repos/{self.repo}/actions/workflows/{workflow}/runs"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        } if self.token else {"Accept": "application/vnd.github+json"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        runs = data.get("workflow_runs", [])
        if not runs:
            return "unknown"
        return runs[0].get("conclusion") or runs[0].get("status", "unknown")


if __name__ == "__main__":
    print("StatusBot ready to check workflow runs.")
