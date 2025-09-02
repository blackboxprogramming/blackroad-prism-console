"""Utility for deleting specified Git branches.

Provides a simple command-line interface and structured logging to
remove branches both locally and on the remote.
"""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import Dict, List
import argparse
import logging

logger = logging.getLogger(__name__)


@dataclass
class CleanupBot:
    """Delete local and remote Git branches.

    Attributes:
        branches: Names of branches to delete.
        dry_run: If ``True``, commands are printed instead of executed.
    """

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run ``cmd`` unless in dry-run mode.

        Args:
            *cmd: Pieces of the command to execute.
        """
        command_str = " ".join(cmd)
        if self.dry_run:
            logger.info("DRY-RUN: %s", command_str)
            return
        logger.debug("RUN: %s", command_str)
        subprocess.run(cmd, check=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete ``branch`` locally and remotely.

        Returns:
            ``True`` if both deletions succeed, ``False`` otherwise.
        """
        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            logger.exception("Failed to delete branch %s", branch)
            return False

    def cleanup(self) -> Dict[str, bool]:
        """Remove all configured branches.

        Returns:
            Mapping of branch names to deletion success.
        """
        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


def main() -> None:
    """Command-line interface for CleanupBot."""
    parser = argparse.ArgumentParser(description="Delete local and remote Git branches.")
    parser.add_argument("branches", nargs="+", help="Branches to delete")
    parser.add_argument(
        "--dry-run", action="store_true", help="Show commands without executing"
    )
    args = parser.parse_args()

    bot = CleanupBot(branches=args.branches, dry_run=args.dry_run)
    for branch, success in bot.cleanup().items():
        status = "deleted" if success else "failed"
        logger.info("%s: %s", branch, status)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
