"""Webber: Automate formatting and validation of web files."""

from dataclasses import dataclass, field
from typing import List
import subprocess
import os
import json


@dataclass
class WebberBot:
    """Automate web file editing, formatting, and validation."""

    root_dir: str = field(default_factory=lambda: os.getcwd())

    def format_html(self, file_path: str) -> None:
        """Format HTML file using Prettier (if installed)."""
        subprocess.run(["prettier", "--write", file_path], check=True)

    def format_css(self, file_path: str) -> None:
        """Format CSS file using Prettier."""
        subprocess.run(["prettier", "--write", file_path], check=True)

    def format_js(self, file_path: str) -> None:
        """Format JS file using Prettier."""
        subprocess.run(["prettier", "--write", file_path], check=True)

    def validate_json(self, file_path: str) -> bool:
        """Validate JSON file syntax."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                json.load(f)
            print(f"{file_path} is valid JSON.")
            return True
        except Exception as e:  # noqa: BLE001
            print(f"JSON validation failed for {file_path}: {e}")
            return False

    def bulk_edit_html(self, search: str, replace: str) -> None:
        """Replace text in all HTML files under root_dir."""
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
                        print(f"Edited {path}")

    def update_config(self, config_path: str, updates: dict) -> None:
        """Update a JSON config file with new key-values."""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data.update(updates)
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Updated config {config_path}")
        except Exception as e:  # noqa: BLE001
            print(f"Failed to update config {config_path}: {e}")

    def run_on_pr(self, files: List[str]) -> None:
        """Format, validate, and auto-fix web files in a pull request."""
        for file_path in files:
            if file_path.endswith(".html"):
                self.format_html(file_path)
            elif file_path.endswith(".css"):
                self.format_css(file_path)
            elif file_path.endswith(".js"):
                self.format_js(file_path)
            elif file_path.endswith(".json"):
                self.validate_json(file_path)


if __name__ == "__main__":
    print("WebberBot ready to edit web files!")
