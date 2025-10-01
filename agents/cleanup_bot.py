"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

import argparse
import logging
import sys
import subprocess
from dataclasses import dataclass
from subprocess import CalledProcessError
from typing import Dict, List


@dataclass(frozen=True)
class CleanupSummary:
    """Structured view of branch deletion results."""

    results: Dict[str, bool]

    def __post_init__(self) -> None:
        # Ensure an immutable snapshot even if the original dict is mutated later.
        object.__setattr__(self, "results", dict(self.results))

    @property
    def deleted(self) -> List[str]:
        """Return branches successfully deleted locally and remotely."""

        return [branch for branch, succeeded in self.results.items() if succeeded]

    @property
    def failed(self) -> List[str]:
        """Return branches that failed to delete."""

        return [branch for branch, succeeded in self.results.items() if not succeeded]

    @property
    def deleted_count(self) -> int:
        """Number of branches removed."""

        return len(self.deleted)

    @property
    def failed_count(self) -> int:
        """Number of branches that could not be removed."""

        return len(self.failed)

    @property
    def total(self) -> int:
        """Total branches processed."""

        return len(self.results)

    def exit_code(self) -> int:
        """Return exit code reflecting whether any deletions failed."""

        return 0 if self.failed_count == 0 else 1


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

    def cleanup(self) -> Dict[str, bool]:
        """Remove the configured branches locally and remotely.

        Returns:
            Mapping of branch names to deletion success.
        """
        results: Dict[str, bool] = {}
        for branch in self.branches:
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

    bot = CleanupBot.from_merged(base=args.base, dry_run=args.dry_run)
    results = bot.cleanup()

    if not results:
        logging.info("No merged branches to clean up.")
        return 0

    summary = CleanupSummary(results)

    for branch in summary.deleted:
        logging.info("%s: deleted", branch)

    for branch in summary.failed:
        logging.warning("%s: failed", branch)

    logging.info(
        "Summary: %d deleted, %d failed (total: %d)",
        summary.deleted_count,
        summary.failed_count,
        summary.total,
    )

    return summary.exit_code()


if __name__ == "__main__":
    sys.exit(main())

