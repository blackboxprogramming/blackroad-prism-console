"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

# --- Imports ---
import argparse
import logging
import subprocess
import sys
from dataclasses import dataclass
from subprocess import CalledProcessError
from typing import Dict, List


# --- Core functionality ---
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
        try:
            result = subprocess.run(
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

    # --- Argument parsing ---
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

    # --- Logging setup ---
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

