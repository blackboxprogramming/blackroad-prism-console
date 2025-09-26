"""Bot for sending notifications to a webhook endpoint."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional
import requests


@dataclass
class NotificationBot:
    """Send messages to an HTTP webhook such as Slack."""

    webhook_url: Optional[str] = None

    def __post_init__(self) -> None:
        if self.webhook_url is None:
            self.webhook_url = os.getenv("WEBHOOK_URL")

    def send(self, message: str) -> None:
        """Post ``message`` to the configured webhook."""
        if not self.webhook_url:
            raise ValueError("webhook_url not configured")
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        response = requests.post(
            self.webhook_url, json={"text": message}, headers=headers, timeout=10
        )
        response.raise_for_status()


if __name__ == "__main__":
    print("NotificationBot ready to send messages.")
