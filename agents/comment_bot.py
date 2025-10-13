"""Post comments to GitHub issues and pull requests with retry logic.

This module provides a small helper class that uses the GitHub REST API to
create issue or pull request comments. If a token is not supplied explicitly,
the ``GITHUB_TOKEN`` environment variable is used. Requests are retried for
transient failures.
"""Post comments to GitHub issues and pull requests.

This module provides a small helper class that uses the GitHub REST API to
create issue or pull request comments. If a token is not supplied explicitly,
the ``GITHUB_TOKEN`` environment variable is used.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional

import requests


def post_with_retry(url, json, headers, timeout: int = 10, max_retries: int = 3):
    """POST request with retry for transient errors."""
    response = None
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=json, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except (requests.ConnectionError, requests.Timeout):
            if attempt < max_retries - 1:
                time.sleep(2**attempt)
                continue
            raise
        except requests.HTTPError:
            if (
                response is not None
                and response.status_code in {502, 503, 504}
                and attempt < max_retries - 1
            ):
                time.sleep(2**attempt)
                continue
            raise


@dataclass
class CommentBot:
    """Automate posting comments using the GitHub API.

    Attributes:
        repo: Repository in ``owner/name`` format.
        token: Personal access token. Defaults to ``GITHUB_TOKEN`` env var.
    """

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        """Resolve token from the environment if not provided."""
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def comment(self, issue_number: int, body: str) -> dict:
        """Post a comment on the specified issue or pull request.

        Args:
            issue_number: Identifier of the issue or pull request to comment on.
            body: Markdown-formatted text of the comment.

        Returns:
            Parsed JSON response from GitHub describing the created comment.

        Raises:
            RuntimeError: If an authentication token is not available.
            requests.HTTPError: If the request fails.
        """
        if not self.token:
            raise RuntimeError("A GitHub token is required to post comments.")

        """Post a comment on a GitHub issue or pull request.

        Args:
            issue_number: The target issue or pull request number.
            body: Markdown content of the comment.

        Returns:
            The JSON response from the GitHub API.
        """
        url = f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/comments"
        url = (
            f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/comments"
        )
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"body": body}
        response = post_with_retry(url, payload, headers)
        return response.json()


if __name__ == "__main__":
    print("CommentBot ready to post comments with retry logic.")
