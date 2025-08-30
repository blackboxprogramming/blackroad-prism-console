"""Bot for posting comments on GitHub issues and pull requests."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional

import requests


@dataclass
class CommentBot:
    """Automate posting comments using the GitHub API."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        """Resolve token from the environment if not provided."""
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def comment(self, issue_number: int, body: str) -> dict:
        """Post a comment on the specified issue or pull request.

        Args:
            issue_number: The issue or pull request number to comment on.
            body: The Markdown-formatted text of the comment.

        Returns:
            The JSON response payload returned by GitHub.

        Raises:
            RuntimeError: If an authentication token is not available.
            requests.HTTPError: If the request fails.
        """
        if not self.token:
            raise RuntimeError("A GitHub token is required to post comments.")

        url = (
            f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/comments"
        )
        headers = {"Authorization": f"token {self.token}"}
        payload = {"body": body}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("CommentBot ready to post comments.")
