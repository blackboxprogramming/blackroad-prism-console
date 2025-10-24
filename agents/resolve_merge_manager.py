"""Resolve-Oriented Branch Merge Manager for Prism Console."""

from __future__ import annotations

import datetime as _dt
import json
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Set

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
    merge_plan: Path = Path("merge_plan.json")
    log_file: Path = LOG_FILE

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

    # ------------------------------ merge plan ------------------------------
    def read_merge_plan(self) -> List[Dict[str, object]]:
        """Return the queue entries from the merge plan if present.

        The merge plan is expected to live at :attr:`merge_plan` and contain a
        ``queue`` key with a list of pull request metadata dictionaries. If the
        file cannot be read or parsed, an empty list is returned.
        """

        try:
            raw = self.merge_plan.read_text(encoding="utf-8")
        except FileNotFoundError:
            return []

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            self._log(f"Failed to parse merge plan: {exc}")
            return []

        queue = data.get("queue", [])
        if not isinstance(queue, list):
            self._log("Merge plan queue missing or invalid; expected list")
            return []

        return [item for item in queue if isinstance(item, dict)]

    def log_new_merges(
        self, entries: Iterable[Dict[str, object]], seen: Set[int] | None = None
    ) -> Set[int]:
        """Append log entries for newly merged pull requests.

        Parameters
        ----------
        entries:
            Iterable of dictionaries containing merge metadata. Each dictionary
            should include ``number`` and ``state`` keys.
        seen:
            A set of previously logged pull request numbers. A new set will be
            created if one is not provided.

        Returns
        -------
        set[int]
            Updated set of logged pull request numbers.
        """

        if seen is None:
            seen = set()
        else:
            seen = set(seen)

        for entry in entries:
            if entry.get("state") != "merged":
                continue

            number = entry.get("number")
            try:
                number_int = int(number)
            except (TypeError, ValueError):
                continue

            if number_int in seen:
                continue

            branch = entry.get("branch")
            title = entry.get("title", "")
            message = f"PR #{number_int} merged"
            if branch:
                message = f"{message} ({branch})"
            if title:
                message = f"{message} - {title}"
            self._log(message)
            seen.add(number_int)

        return seen

    def watch_merge_plan(self, interval: float = 30.0) -> None:
        """Continuously watch the merge plan for merged pull requests.

        This method polls :attr:`merge_plan` at the provided interval and logs
        newly merged pull requests to :attr:`log_file`. It runs until interrupted.
        """

        seen: Set[int] = set()
        self._log(
            f"Watching merge plan at {self.merge_plan} with {interval:.1f}s interval"
        )
        try:
            while True:
                entries = self.read_merge_plan()
                seen = self.log_new_merges(entries, seen)
                time.sleep(interval)
        except KeyboardInterrupt:
            self._log("Merge plan watch interrupted; stopping")

    def _log(self, message: str) -> None:
        """Append a message to the merge log."""
        timestamp = _dt.datetime.utcnow().isoformat()
        self.log_file.touch(exist_ok=True)
        with self.log_file.open("a", encoding="utf-8") as log:
            log.write(f"{timestamp} {message}\n")
