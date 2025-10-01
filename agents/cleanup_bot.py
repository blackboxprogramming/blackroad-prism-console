"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

import argparse
import logging
import sys
import subprocess
from dataclasses import dataclass
from subprocess import CalledProcessError
from typing import Dict, List

from logging import Logger


@dataclass
class CleanupSummary:
    """Summary of cleanup results for a batch of branches."""

    results: Dict[str, bool]

    @property
    def deleted(self) -> int:
        """Number of branches successfully deleted."""

        return sum(1 for deleted in self.results.values() if deleted)

    @property
    def failed(self) -> int:
        """Number of branches that failed to delete."""

        return sum(1 for deleted in self.results.values() if not deleted)

    def is_empty(self) -> bool:
        """Return ``True`` when there are no branches in the summary."""

        return not self.results

    def log_details(self, logger: Logger) -> None:
        """Log per-branch results and overall summary using ``logger``."""

        for branch, deleted in self.results.items():
            status = "deleted" if deleted else "failed"
            logger.info("%s: %s", branch, status)
        logger.info("Summary: %d deleted, %d failed", self.deleted, self.failed)


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Attributes:
        branches: Branch names to remove.
        dry_run: If True, print commands instead of executing them.
    """

    branches: List[str]
    dry_run: bool = False

    @staticmethod
    def merged_branches(base: str = "main") -> List[str]:
        """Return names of branches merged into ``base``.

        Args:
            base: Branch to compare against.

        Returns:
            List of merged branch names excluding ``base`` and ``HEAD``.
        """
        result = subprocess.run(
            ["git", "branch", "--merged", base],
            capture_output=True,
            text=True,
            check=True,
        )
        # Extract branch names from the command output while ignoring
        # the base branch and "HEAD" references.
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
        subprocess.run(cmd, check=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            True if the branch was deleted locally and remotely, False otherwise.
        """
        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            return False

    def cleanup(self) -> CleanupSummary:
        """Remove the configured branches locally and remotely.

        Returns:
            Summary containing per-branch deletion status.
        """
        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return CleanupSummary(results)


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

    bot = CleanupBot.from_merged(base=args.base, dry_run=args.dry_run)
    summary = bot.cleanup()

    if summary.is_empty():
        logging.info("No merged branches to clean up.")
        return 0

    summary.log_details(logging.getLogger(__name__))

    return 0 if summary.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

