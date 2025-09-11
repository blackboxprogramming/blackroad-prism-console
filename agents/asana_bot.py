"""Bot for interacting with Asana tasks and projects."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
import os
import requests


@dataclass
class AsanaBot:
    """Automate basic Asana operations such as creating and completing tasks."""

    project_id: str
    token: Optional[str] = None

    def __post_init__(self) -> None:
        """Load token from the ``ASANA_TOKEN`` environment variable if unset."""
        if self.token is None:
            self.token = os.getenv("ASANA_TOKEN")

    def _headers(self) -> dict:
        """Return HTTP headers including authorization when available."""
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def create_task(self, name: str, notes: str = "") -> dict:
        """Create a new task in the configured project."""
        url = "https://app.asana.com/api/1.0/tasks"
        payload = {"data": {"name": name, "notes": notes, "projects": [self.project_id]}}
        response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        response.raise_for_status()
        return response.json()

    def list_tasks(self) -> List[dict]:
        """List tasks within the configured project."""
        url = f"https://app.asana.com/api/1.0/projects/{self.project_id}/tasks"
        response = requests.get(url, headers=self._headers(), timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])

    def complete_task(self, task_gid: str) -> dict:
        """Mark an Asana task as completed."""
        url = f"https://app.asana.com/api/1.0/tasks/{task_gid}"
        payload = {"data": {"completed": True}}
        response = requests.put(url, json=payload, headers=self._headers(), timeout=10)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    print("AsanaBot ready to manage tasks.")

