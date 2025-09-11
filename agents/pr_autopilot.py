"""Automates pull request management tasks for BlackRoad repositories."""

from __future__ import annotations

import logging
import os
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import requests


@dataclass
class AutomatedPullRequestManager:
    """Monitor Git events and orchestrate draft pull requests."""

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
        """Check whether the repository has uncommitted changes."""
        result = subprocess.run(
            ["git", "status", "--porcelain"], capture_output=True, text=True, check=False
        )
        return bool(result.stdout.strip())

    def prepare_draft_pr(self) -> None:
        """Create a draft pull request from the latest commit."""
        commit_msg = subprocess.run(
            ["git", "log", "-1", "--pretty=%s"], capture_output=True, text=True, check=False
        ).stdout.strip()
        branch_name = f"{self.branch_prefix}{int(time.time())}"
        # Use a timestamp to generate a unique branch name.
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
        """Create a pull request via the GitHub API and return its response."""
        url = f"https://api.github.com/repos/{self.repo}/pulls"
        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        payload = {"title": title, "head": head, "base": base, "body": body, "draft": True}
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def _assign_reviewer(self, pr_number: int) -> None:
        """Request a review from the default reviewer."""
        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}/requested_reviewers"
        headers = {"Accept": "application/vnd.github+json"}
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        payload = {"reviewers": [self.default_reviewer]}
        requests.post(url, json=payload, headers=headers, timeout=10)

    def handle_trigger(self, phrase: str) -> None:
        """Respond to CODEx trigger phrases and run the matching action."""
        phrase_lower = phrase.lower()
        if "fix comments" in phrase_lower:
            self.apply_comment_fixes()
        elif "summarize" in phrase_lower:
            self.log("Summarizing PR (placeholder)")
        elif "merge" in phrase_lower:
            self.log("Merging PR (placeholder)")

    def apply_comment_fixes(self) -> None:
        """Execute the CODEx comment fixer script to update code comments."""
        repo_root = Path(__file__).resolve().parents[1]
        try:
            subprocess.run(
                ["node", ".github/tools/codex-apply.js", ".github/prompts/codex-fix-comments.md"],
                check=True,
                cwd=repo_root,
            )
            self.log("Applied comment fixes")
        except (OSError, subprocess.CalledProcessError) as exc:
            self.log(f"Failed to apply comment fixes: {exc}")

    def log(self, message: str) -> None:
        """Write a message to the log file."""
        logging.info(message)


if __name__ == "__main__":
    manager = AutomatedPullRequestManager("blackboxprogramming/blackroad")
    print("AutomatedPullRequestManager ready to manage pull requests.")
