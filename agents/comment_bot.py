"""Post comments to GitHub issues and pull requests."""
"""Post comments to GitHub issues and pull requests.

This module provides a small helper class that uses the GitHub REST API to
create issue or pull request comments. If a token is not supplied explicitly,
the ``GITHUB_TOKEN`` environment variable is used.

Example:
    >>> bot = CommentBot(repo="octocat/hello-world")
    >>> bot.comment(issue_number=1, body="Hello from CommentBot!")
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


def post_with_retry(
    url: str,
    json: Dict[str, Any],
    headers: Dict[str, str],
    timeout: int = 10,
    max_retries: int = 3,
) -> requests.Response:
    """Send a POST request with basic retry logic for transient failures."""

    response: Optional[requests.Response] = None
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
    # Should not reach here because loop either returns or raises.
    raise RuntimeError("POST request retries exhausted.")


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

    def comment(self, issue_number: int, body: str) -> Dict[str, Any]:
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

        url = f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/comments"
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
