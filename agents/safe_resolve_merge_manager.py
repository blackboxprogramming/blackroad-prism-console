"""Safely merge multiple branches into a temporary resolve branch.

This agent fetches remote branches, groups them by prefix, and merges a
subset into a new resolve branch. If the merge succeeds, it pushes the branch
and opens a draft pull request for review. All operations are logged to
``prism_resolve.log``.
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional

import requests


@dataclass
class SafeResolveMergeManager:
    """Automate safe resolution of multiple branches."""

    repo_path: str = "."
    main_branch: str = "main"
    resolve_trigger: str = "@codex resolve"
    safe_merge_limit: int = 10
    branch_groups: List[str] = field(
        default_factory=lambda: ["mainline", "automation", "fixes", "features", "deps"]
    )
    log_file: str = "prism_resolve.log"
    token: Optional[str] = None

    def __post_init__(self) -> None:
        if self.token is None:
            self.token = os.getenv("GITHUB_TOKEN")

    # ---------------------------- git utilities ----------------------------
    def _run_git(self, *args: str) -> str:
        """Run a git command and return its output."""
        return subprocess.check_output(
            ["git", *args], cwd=self.repo_path, text=True
        ).strip()

    def fetch_branches(self) -> List[str]:
        """Fetch remote branches from origin and return their names."""
        self._run_git("fetch", "origin")
        output = self._run_git(
            "for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"
        )
        return [line.replace("origin/", "") for line in output.splitlines() if "/" in line]

    def group_branches(self, branches: List[str]) -> Dict[str, List[str]]:
        """Group branches by their prefix."""
        grouped = {group: [] for group in self.branch_groups}
        for branch in branches:
            for group in self.branch_groups:
                if branch.startswith(f"{group}/"):
                    grouped[group].append(branch)
                    break
        return grouped

    def create_resolve_branch(self, group: str) -> str:
        """Create and checkout a new resolve branch based on ``main_branch``."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        resolve_branch = f"resolve/{group}-{timestamp}"
        self._run_git("checkout", self.main_branch)
        self._run_git("checkout", "-b", resolve_branch)
        return resolve_branch

    def merge_branches(self, resolve_branch: str, branches: List[str]) -> List[Dict[str, str]]:
        """Attempt to merge each branch; return conflict information."""
        conflicts: List[Dict[str, str]] = []
        for branch in branches:
            try:
                self._run_git("merge", f"origin/{branch}")
                self.log(f"Merged {branch} into {resolve_branch}")
            except subprocess.CalledProcessError:
                diff = self._run_git("diff")
                conflicts.append({"branch": branch, "diff": diff})
                self._run_git("merge", "--abort")
        return conflicts

    def commit_and_push(self, resolve_branch: str, group: str, merged: List[str]) -> None:
        """Commit changes and push the resolve branch to origin."""
        self._run_git("add", "-A")
        message = f"Codex: resolved {group} conflicts via Alexa"
        self._run_git("commit", "-m", message)
        self._run_git("push", "origin", resolve_branch)
        self.log(json.dumps({"resolve_branch": resolve_branch, "merged": merged}))

    # ---------------------------- GitHub API -----------------------------
    def open_draft_pr(self, resolve_branch: str, merged: List[str]) -> dict:
        """Open a draft pull request summarizing merged branches."""
        if not self.token:
            raise RuntimeError("GITHUB_TOKEN is required to open PRs")
        repo = os.getenv("GITHUB_REPOSITORY", "")
        url = f"https://api.github.com/repos/{repo}/pulls"
        headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
        }
        body = {
            "title": f"Resolve {resolve_branch}",
            "head": resolve_branch,
            "base": self.main_branch,
            "draft": True,
            "body": "Merged branches:\n" + "\n".join(f"- {b}" for b in merged),
        }
        response = requests.post(url, json=body, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    # ------------------------------ logging ------------------------------
    def log(self, message: str) -> None:
        """Append a message with timestamp to ``prism_resolve.log``."""
        path = os.path.join(self.repo_path, self.log_file)
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(f"{datetime.utcnow().isoformat()} {message}\n")


def main() -> None:
    """Entry point for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Safe Resolve Merge Manager")
    parser.add_argument("group", choices=["mainline", "automation", "fixes", "features", "deps"])
    parser.add_argument("--limit", type=int, default=None, help="Maximum branches to merge")
    args = parser.parse_args()

    manager = SafeResolveMergeManager()
    branches = manager.fetch_branches()
    grouped = manager.group_branches(branches)
    selection = grouped.get(args.group, [])[: args.limit or manager.safe_merge_limit]
    resolve_branch = manager.create_resolve_branch(args.group)
    conflicts = manager.merge_branches(resolve_branch, selection)
    if conflicts:
        print(json.dumps(conflicts, indent=2))
        return
    manager.commit_and_push(resolve_branch, args.group, selection)
    pr = manager.open_draft_pr(resolve_branch, selection)
    print(json.dumps(pr, indent=2))


if __name__ == "__main__":
    main()
