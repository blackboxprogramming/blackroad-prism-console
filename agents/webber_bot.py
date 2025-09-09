"""Webber: Web Editor Bot for HTML, CSS, JS, JSON, and config files.

- Formats and validates web files.
- Performs bulk edits (e.g., accessibility, footer, search/replace).
- Can be triggered on PRs, issues, or CLI.
- Posts status/errors to Slack (via NotificationBot) and updates AGENT_WORKBOARD.md.
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass, field
from typing import Optional

from agents.notification_bot import NotificationBot


@dataclass
class WebberBot:
    """Edit and validate web files, notifying on actions."""

    root_dir: str = field(default_factory=lambda: os.getcwd())
    notification_bot: Optional[NotificationBot] = None

    def _run_prettier(self, file_path: str) -> None:
        """Run prettier on ``file_path`` and raise on failure."""
        try:
            subprocess.run(["prettier", "--write", file_path], check=True)
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            raise RuntimeError(f"Prettier failed for {file_path}: {exc}") from exc

    def format_html(self, file_path: str) -> None:
        """Format an HTML file using Prettier."""
        self._run_prettier(file_path)

    def format_css(self, file_path: str) -> None:
        """Format a CSS file using Prettier."""
        self._run_prettier(file_path)

    def format_js(self, file_path: str) -> None:
        """Format a JavaScript file using Prettier."""
        self._run_prettier(file_path)

    def validate_json(self, file_path: str) -> bool:
        """Validate a JSON file and notify on failure."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                json.load(f)
            return True
        except Exception as exc:  # pylint: disable=broad-except
            self.notify(f"JSON validation failed for {file_path}: {exc}")
            return False

    def bulk_edit_html(self, search: str, replace: str) -> None:
        """Replace ``search`` with ``replace`` in all HTML files under ``root_dir``."""
        for dirpath, _, filenames in os.walk(self.root_dir):
            for fname in filenames:
                if fname.endswith(".html"):
                    path = os.path.join(dirpath, fname)
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    new_content = content.replace(search, replace)
                    if new_content != content:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        self.notify(f"Edited {path}")

    def update_config(self, config_path: str, updates: dict) -> None:
        """Update a JSON config file with provided ``updates``."""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data.update(updates)
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            self.notify(f"Updated config {config_path}")
        except Exception as exc:  # pylint: disable=broad-except
            self.notify(f"Failed to update config {config_path}: {exc}")

    def notify(self, message: str) -> None:
        """Send a notification via NotificationBot if configured."""
        if self.notification_bot:
            self.notification_bot.send(message)
        print(message)

    def run_on_pr(self, files: list[str]) -> None:
        """Process ``files`` based on their extension."""
        for file_path in files:
            try:
                if file_path.endswith(".html"):
                    self.format_html(file_path)
                elif file_path.endswith(".css"):
                    self.format_css(file_path)
                elif file_path.endswith(".js"):
                    self.format_js(file_path)
                elif file_path.endswith(".json"):
                    self.validate_json(file_path)
                self.notify(f"Processed {file_path} successfully")
            except Exception as exc:  # pylint: disable=broad-except
                self.notify(f"Error processing {file_path}: {exc}")


if __name__ == "__main__":
    webber = WebberBot(notification_bot=NotificationBot())
    print("WebberBot is ready to edit web files and send notifications.")
