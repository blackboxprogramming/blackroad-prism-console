"""Simple helper for deleting Git branches locally and remotely."""

from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass
from subprocess import CalledProcessError, DEVNULL, run
from typing import Dict, List
from dataclasses import dataclass, field
import subprocess
from subprocess import CalledProcessError
from typing import Dict, Iterable, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges."""
    """Delete local and remote Git branches.

    Parameters
    ----------
    branches:
        Iterable of branch names to delete.
    dry_run:
        When ``True``, commands are printed instead of executed.
    """

    branches: Iterable[str]
    dry_run: bool = False
    _normalized_branches: List[str] = field(init=False, repr=False)

    @staticmethod
    def merged_branches(base: str = "main") -> List[str]:
        """Return names of branches merged into ``base``."""

        try:
            result = run(
                ["git", "branch", "--merged", base],
                capture_output=True,
                text=True,
                check=True,
            )
        except CalledProcessError as exc:
            logging.error("Failed to list merged branches: %s", exc)
            raise RuntimeError("Could not list merged branches") from exc

        branches: List[str] = []
        for line in result.stdout.splitlines():
            name = line.strip().lstrip("*").strip()
            if name and name not in {base, "HEAD"}:
                branches.append(name)

        return branches

    @classmethod
    def from_merged(cls, base: str = "main", dry_run: bool = False) -> "CleanupBot":
        """Create a bot targeting branches merged into ``base``."""

        return cls(branches=cls.merged_branches(base), dry_run=dry_run)

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""

        if self.dry_run:
            logging.info("DRY-RUN: %s", " ".join(cmd))
            return

        run(cmd, check=True)

    def _local_branch_exists(self, branch: str) -> bool:
        """Return True if the local branch still exists."""

        if self.dry_run:
            return True

        result = run(
            ("git", "show-ref", "--verify", f"refs/heads/{branch}"),
            stdout=DEVNULL,
            stderr=DEVNULL,
            check=False,
        )
        return result.returncode == 0

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely."""

        local_deleted = True
        try:
            self._run("git", "branch", "-D", branch)
        except CalledProcessError:
            local_deleted = not self._local_branch_exists(branch)

        remote_deleted = True
        try:
            self._run("git", "push", "origin", "--delete", branch)
        except CalledProcessError:
            remote_deleted = False

        return local_deleted and remote_deleted

    def cleanup(self) -> Dict[str, bool]:
        """Remove the configured branches locally and remotely."""

        results: Dict[str, bool] = {}
        for branch in self.branches:
    def __post_init__(self) -> None:
        self._normalized_branches = list(self.branches)

    def _run(self, *cmd: str) -> None:
        """Run a git command unless in dry-run mode."""
        command = " ".join(cmd)
        if self.dry_run:
            print(f"DRY-RUN: {command}")
            return
        subprocess.check_call(cmd)

    def delete_branch(self, branch: str) -> bool:
        """Delete ``branch`` locally and on ``origin``.

        Returns ``True`` when both deletions succeed and ``False`` if an
        error occurs.
        """

        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
        except CalledProcessError:
            print(f"Failed to delete branch: {branch}")
            return False
        return True

    def cleanup(self) -> Dict[str, bool]:
        """Delete all configured branches."""

        results: Dict[str, bool] = {}
        for branch in self._normalized_branches:
            results[branch] = self.delete_branch(branch)
        return results


def main(argv: List[str] | None = None) -> int:
    """Entry point for the CleanupBot CLI."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base",
        default="main",
        help="Base branch to compare against",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show commands without executing them",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")

    try:
        bot = CleanupBot.from_merged(base=args.base, dry_run=args.dry_run)
    except RuntimeError as exc:
        logging.error("%s", exc)
        return 1

    if not bot.branches:
        logging.info("No merged branches to clean up.")
        return 0

    results = bot.cleanup()
    for branch, deleted in results.items():
        status = "deleted" if deleted else "failed"
        logging.info("%s: %s", branch, status)

    successes = sum(1 for deleted in results.values() if deleted)
    failures = len(results) - successes
    logging.info("Summary: %d deleted, %d failed", successes, failures)

    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
def cleanup(branches: Iterable[str], dry_run: bool = False) -> Dict[str, bool]:
    """Convenience wrapper around :class:`CleanupBot`."""

    return CleanupBot(branches=branches, dry_run=dry_run).cleanup()
