"""Resolve-Oriented Branch Merge Manager for Prism Console."""

from __future__ import annotations

import datetime as _dt
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

LOG_FILE = Path("prism_console_merge.log")


@dataclass
class ResolveMergeManager:
    """Utility class to coordinate safe multi-branch merges.

    The manager mirrors the requested behaviour from Alexa. It can
    pull the latest ``main`` branch, inspect remote branches, prepare a
    temporary resolve branch, and log merge activity.
    """

    repo: str = "."
    main_branch: str = "main"
    safe_merge_limit: int = 10

    def auto_pull(self) -> None:
        """Fetch and pull the latest ``main`` branch."""
        subprocess.run(
            ["git", "fetch", "origin", self.main_branch],
            check=True,
            cwd=self.repo,
        )
        subprocess.run(
            ["git", "pull", "origin", self.main_branch],
            check=True,
            cwd=self.repo,
        )

    def scan_remote_branches(self) -> List[Dict[str, str]]:
        """Return a summary of remote branches.

        Each dictionary contains ``name``, ``commit`` and a boolean
        ``conflicts`` flag indicating whether merging into ``main`` would
        produce conflicts.
        """
        output = subprocess.check_output(
            ["git", "ls-remote", "--heads", "origin"],
            cwd=self.repo,
            text=True,
        )
        branches: List[Dict[str, str]] = []
        for line in output.strip().splitlines():
            commit, ref = line.split()
            name = ref.split("/")[-1]
            conflict = self._has_conflicts(name)
            branches.append({"name": name, "commit": commit, "conflicts": conflict})
        return branches

    def _has_conflicts(self, branch: str) -> bool:
        """Return ``True`` if merging ``branch`` into ``main`` conflicts."""
        base = subprocess.check_output(
            ["git", "merge-base", self.main_branch, branch],
            cwd=self.repo,
            text=True,
        ).strip()
        tree = subprocess.check_output(
            ["git", "merge-tree", base, self.main_branch, branch],
            cwd=self.repo,
            text=True,
        )
        return "<<<<<<<" in tree

    def fetch_conflict_hunks(self) -> Dict[str, str]:
        """Return conflict hunks for the current merge state."""
        files = subprocess.check_output(
            ["git", "diff", "--name-only", "--diff-filter=U"],
            cwd=self.repo,
            text=True,
        ).split()
        hunks: Dict[str, str] = {}
        for file in files:
            hunks[file] = subprocess.check_output(
                ["git", "diff", file], cwd=self.repo, text=True
            )
        return hunks

    def stage_resolved_files(self, files: List[str]) -> None:
        """Stage files after manual conflict resolution."""
        subprocess.run(["git", "add", *files], check=True, cwd=self.repo)

    def create_resolve_branch(self, branches: List[str]) -> str:
        """Create a temporary resolve branch and merge the given branches."""
        if len(branches) > self.safe_merge_limit:
            raise ValueError("safe merge limit exceeded")
        timestamp = _dt.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        resolve_branch = f"resolve/{timestamp}"
        subprocess.run(
            ["git", "checkout", "-b", resolve_branch, f"origin/{self.main_branch}"],
            check=True,
            cwd=self.repo,
        )
        for branch in branches:
            result = subprocess.run(
                ["git", "merge", "--no-ff", branch],
                cwd=self.repo,
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                self._log(f"Conflict merging {branch}: {result.stderr.strip()}")
                raise RuntimeError(f"Merge conflict in {branch}")
        commit_msg = "Codex: resolved conflicts via Alexa"
        subprocess.run(
            ["git", "commit", "--allow-empty", "-m", commit_msg],
            check=True,
            cwd=self.repo,
        )
        self._log(
            f"Merged branches {branches} into {resolve_branch}"
        )
        return resolve_branch

    def push_resolve_branch(self, branch: str) -> None:
        """Push the temporary resolve branch to origin."""
        subprocess.run(["git", "push", "origin", branch], check=True, cwd=self.repo)

    def _log(self, message: str) -> None:
        """Append a message to the merge log."""
        timestamp = _dt.datetime.utcnow().isoformat()
        LOG_FILE.touch(exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as log:
            log.write(f"{timestamp} {message}\n")
