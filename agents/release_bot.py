"""Bot for creating GitHub releases."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class ReleaseBot:
    """Automate creation of GitHub releases."""

    repo: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    def create_release(self, tag: str, name: str, body: str = "") -> dict:
        """Create a release for the given tag."""
        url = f"https://api.github.com/repos/{self.repo}/releases"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        } if self.token else {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        payload = {"tag_name": tag, "name": name, "body": body}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("ReleaseBot ready to create releases.")
