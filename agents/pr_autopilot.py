"""Automated pull request manager for BlackRoad repos."""

from __future__ import annotations

import logging
import os
import subprocess
import time
from dataclasses import dataclass
from typing import Optional

import requests


@dataclass
class AutomatedPullRequestManager:
    """Monitor git events and orchestrate draft pull requests."""

    repo: str
    branch_prefix: str = "codex/"
    default_reviewer: str = "alexa"
    codex_trigger: str = "@codex"
    log_file: str = "pr_autopilot.log"
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")
        logging.basicConfig(filename=self.log_file, level=logging.INFO)

    def monitor_repo(self) -> bool:
        """Return True if repo has uncommitted changes."""
        result = subprocess.run(
            ["git", "status", "--porcelain"], capture_output=True, text=True, check=False
        )
        return bool(result.stdout.strip())

    def prepare_draft_pr(self) -> None:
        """Create a draft pull request from latest commit."""
        commit_msg = subprocess.run(
            ["git", "log", "-1", "--pretty=%s"], capture_output=True, text=True, check=False
        ).stdout.strip()
        branch_name = f"{self.branch_prefix}{int(time.time())}"
        subprocess.run(["git", "checkout", "-b", branch_name], check=False)
        subprocess.run(["git", "push", "-u", "origin", branch_name], check=False)
        diff = subprocess.run(
            ["git", "diff", "origin/main..."], capture_output=True, text=True, check=False
        ).stdout
        body = f"### Diff Summary\n```\n{diff[:1000]}\n```\n"
        pr = self._create_pr(commit_msg, branch_name, "main", body)
        self._assign_reviewer(pr["number"])
        logging.info("Opened draft PR #%s", pr["number"])

    def _create_pr(self, title: str, head: str, base: str, body: str) -> dict:
        url = f"https://api.github.com/repos/{self.repo}/pulls"
        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        payload = {"title": title, "head": head, "base": base, "body": body, "draft": True}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def _assign_reviewer(self, pr_number: int) -> None:
        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}/requested_reviewers"
        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        payload = {"reviewers": [self.default_reviewer]}
        requests.post(url, json=payload, headers=headers, timeout=10)

    def handle_trigger(self, phrase: str) -> None:
        """React to codex trigger phrases."""
        if "fix comments" in phrase:
            self.log("Applying review comment fixes (placeholder)")
        elif "summarize" in phrase:
            self.log("Summarizing PR (placeholder)")
        elif "merge" in phrase:
            self.log("Merging PR (placeholder)")

    def log(self, message: str) -> None:
        """Log an arbitrary message to the log file."""
        logging.info(message)


if __name__ == "__main__":
    manager = AutomatedPullRequestManager("blackboxprogramming/blackroad")
    print("AutomatedPullRequestManager ready to manage pull requests.")
