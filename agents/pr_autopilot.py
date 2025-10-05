"""Automates pull request management tasks for BlackRoad repositories."""

from __future__ import annotations

import logging
import os
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence

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
    auto_fix_commands: tuple[Sequence[str] | str, ...] = (
        ("bash", "fix-everything.sh"),
    )
    max_fix_iterations: int = 3

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")
        logging.basicConfig(filename=self.log_file, level=logging.INFO)

    def monitor_repo(self) -> bool:
        """Check whether the repository has uncommitted changes."""
        return self._has_uncommitted_changes(Path.cwd())

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
        self.auto_enhance_pull_request(pr["number"], branch_name)
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

    def handle_trigger(
        self,
        phrase: str,
        pr_number: Optional[int] = None,
        branch_name: Optional[str] = None,
    ) -> None:
        """Respond to CODEx trigger phrases and run the matching action."""

        phrase_lower = phrase.lower()

        if "fix comments" in phrase_lower:
            self.apply_comment_fixes(pr_number=pr_number, branch_name=branch_name)
        elif "summarize" in phrase_lower:
            self.log("Summarizing PR (placeholder)")
        elif "merge" in phrase_lower and pr_number is not None:
            self.enable_auto_merge(pr_number)
        elif "merge" in phrase_lower:
            self.log("Merge trigger received but no PR number supplied; skipping.")

    def apply_comment_fixes(
        self,
        pr_number: Optional[int] = None,
        branch_name: Optional[str] = None,
    ) -> None:
        """Execute the CODEx comment fixer script to update code comments."""

        repo_root = Path(__file__).resolve().parents[1]

        if branch_name:
            try:
                subprocess.run(
                    ["git", "checkout", branch_name],
                    check=True,
                    cwd=repo_root,
                )
            except (OSError, subprocess.CalledProcessError) as exc:
                self.log(f"Unable to checkout branch {branch_name!r}: {exc}")
                return

        try:
            subprocess.run(
                [
                    "node",
                    ".github/tools/codex-apply.js",
                    ".github/prompts/codex-fix-comments.md",
                ],
                check=True,
                cwd=repo_root,
            )
            self.log("Applied comment fixes")
        except (OSError, subprocess.CalledProcessError) as exc:
            self.log(f"Failed to apply comment fixes: {exc}")
            return

        if branch_name and self._has_uncommitted_changes(repo_root):
            if not self._commit_with_message(
                repo_root,
                branch_name,
                "chore: apply codex comment fixes",
            ):
                return

        if pr_number is not None:
            self._comment_on_pr(pr_number, "Comment fixes applied :sparkles:")

        if branch_name and pr_number is not None:
            self.auto_enhance_pull_request(pr_number, branch_name)
            self.enable_auto_merge(pr_number)

    def log(self, message: str) -> None:
        """Write a message to the log file."""
        logging.info(message)

    def auto_enhance_pull_request(self, pr_number: int, branch_name: str) -> None:
        """Apply configured fixers to iteratively improve an open pull request."""
        if not self.auto_fix_commands:
            self.log("No auto-fix commands configured; skipping enhancements.")
            return

        repo_root = Path(__file__).resolve().parents[1]
        try:
            subprocess.run(["git", "checkout", branch_name], cwd=repo_root, check=True)
        except (OSError, subprocess.CalledProcessError) as exc:
            self.log(f"Unable to checkout branch {branch_name!r}: {exc}")
            return

        for iteration in range(1, self.max_fix_iterations + 1):
            self.log(f"Running auto-fix iteration {iteration} for PR #{pr_number}")

            for command in self.auto_fix_commands:
                self._run_auto_fix_command(command, repo_root)

            if not self._has_uncommitted_changes(repo_root):
                self.log(f"No changes detected after auto-fix iteration {iteration}; stopping.")
                break

            if not self._commit_and_push(branch_name, repo_root, iteration):
                break

            self._comment_on_pr(
                pr_number,
                f"Auto-fix pass {iteration} applied :sparkles:",
            )

    def _has_uncommitted_changes(self, cwd: Path) -> bool:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=False,
            cwd=cwd,
        )
        return bool(result.stdout.strip())

    def _run_auto_fix_command(
        self, command: Sequence[str] | str, repo_root: Path
    ) -> bool:
        shell = isinstance(command, str)
        cmd = command if shell else list(command)
        try:
            subprocess.run(
                cmd,
                cwd=repo_root,
                check=True,
                shell=shell,
            )
            return True
        except (OSError, subprocess.CalledProcessError) as exc:
            self.log(f"Auto-fix command {command!r} failed: {exc}")
            return False

    def _commit_and_push(self, branch_name: str, repo_root: Path, iteration: int) -> bool:
        try:
            subprocess.run(["git", "add", "-A"], cwd=repo_root, check=True)
            commit_message = f"chore: auto improvements (pass {iteration})"
            subprocess.run(
                ["git", "commit", "-m", commit_message],
                cwd=repo_root,
                check=True,
            )
            subprocess.run(
                ["git", "push", "origin", branch_name],
                cwd=repo_root,
                check=True,
            )
            return True
        except subprocess.CalledProcessError as exc:
            self.log(f"Failed to commit/push auto-fix iteration {iteration}: {exc}")
            return False

    def _commit_with_message(
        self, repo_root: Path, branch_name: str, message: str
    ) -> bool:
        try:
            subprocess.run(["git", "add", "-A"], cwd=repo_root, check=True)
            if not self._has_uncommitted_changes(repo_root):
                self.log("No changes detected after applying fixes; nothing to commit.")
                return False
            subprocess.run(
                ["git", "commit", "-m", message],
                cwd=repo_root,
                check=True,
            )
            subprocess.run(
                ["git", "push", "origin", branch_name],
                cwd=repo_root,
                check=True,
            )
            return True
        except subprocess.CalledProcessError as exc:
            self.log(f"Failed to commit/push comment fixes: {exc}")
            return False

    def _comment_on_pr(self, pr_number: int, message: str) -> None:
        if not self.token:
            self.log("Skipping PR comment because no token is configured.")
            return

        url = f"https://api.github.com/repos/{self.repo}/issues/{pr_number}/comments"
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"token {self.token}",
        }
        try:
            response = requests.post(
                url,
                json={"body": message},
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            self.log(f"Failed to post auto-fix comment to PR #{pr_number}: {exc}")

    def enable_auto_merge(self, pr_number: int, merge_method: str = "SQUASH") -> None:
        """Enable GitHub auto-merge for the given pull request."""

        if not self.token:
            self.log("Skipping auto-merge enablement because no token is configured.")
            return

        node_id = self._get_pr_node_id(pr_number)
        if not node_id:
            self.log(f"Unable to determine node id for PR #{pr_number}; cannot enable auto-merge.")
            return

        method = merge_method.upper()
        query = (
            "mutation($pr:ID!,$method:PullRequestMergeMethod!)"
            "{ enablePullRequestAutoMerge("
            "input:{pullRequestId:$pr, mergeMethod:$method})"
            "{ clientMutationId }}"
        )
        payload = {"query": query, "variables": {"pr": node_id, "method": method}}
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        }
        try:
            response = requests.post(
                "https://api.github.com/graphql",
                json=payload,
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            self.log(f"Enabled auto-merge for PR #{pr_number}")
        except requests.RequestException as exc:
            self.log(f"Failed to enable auto-merge for PR #{pr_number}: {exc}")

    def _get_pr_node_id(self, pr_number: int) -> Optional[str]:
        if not self.token:
            return None

        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        }
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json().get("node_id")
        except requests.RequestException as exc:
            self.log(f"Failed to fetch PR #{pr_number} metadata: {exc}")
            return None


if __name__ == "__main__":
    manager = AutomatedPullRequestManager("blackboxprogramming/blackroad")
    print("AutomatedPullRequestManager ready to manage pull requests.")
