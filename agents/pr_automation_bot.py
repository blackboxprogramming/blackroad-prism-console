"""Post an informational comment on a pull request."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

import requests


@dataclass
class PRAutomationBot:
    """Lightweight automation for GitHub pull requests."""

    repo: str
    pr_number: int
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def run(self, branch: str) -> dict:
        """Post a comment noting the bot execution."""
        url = f"https://api.github.com/repos/{self.repo}/issues/{self.pr_number}/comments"
        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        payload = {"body": f"PR Automation Bot executed on branch `{branch}`."}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    repo = os.environ.get("GITHUB_REPO", "")
    pr_number = int(os.environ.get("PR_NUMBER", "0"))
    branch = os.environ.get("PR_BRANCH", "")
    bot = PRAutomationBot(repo=repo, pr_number=pr_number)
    bot.run(branch)
    print("PR Automation Bot comment posted.")
