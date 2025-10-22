"""Utility bot for cleaning up merged Git branches."""

from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass, field
from subprocess import CalledProcessError, CompletedProcess, DEVNULL, run
from typing import Dict, Iterable, List

LOGGER = logging.getLogger(__name__)


@dataclass
class CleanupBot:
    """Delete local and remote Git branches once work is merged."""

    branches: Iterable[str]
    dry_run: bool = False
    _normalized_branches: List[str] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        """Normalise the provided branch names."""

        seen: set[str] = set()
        normalized: List[str] = []
        for raw_name in self.branches:
            name = raw_name.strip()
            if not name or name in seen:
                continue
            seen.add(name)
            normalized.append(name)
        self._normalized_branches = normalized
        self.branches = list(normalized)

    @staticmethod
    def merged_branches(base: str = "main") -> List[str]:
        """Return the names of branches merged into ``base``."""

        try:
            result = run(
                ["git", "branch", "--merged", base],
                capture_output=True,
                text=True,
                check=True,
            )
        except CalledProcessError as exc:
            LOGGER.error("Failed to list merged branches", exc_info=exc)
            raise RuntimeError("Could not list merged branches") from exc

        branches: List[str] = []
        for line in result.stdout.splitlines():
            name = line.strip().lstrip("*").strip()
            if not name or name in {base, "HEAD"}:
                continue
            branches.append(name)
        return branches

    @classmethod
    def from_merged(cls, base: str = "main", dry_run: bool = False) -> "CleanupBot":
        """Construct a bot for branches merged into ``base``."""

        return cls(branches=cls.merged_branches(base), dry_run=dry_run)

    def _run(self, *cmd: str) -> CompletedProcess | None:
        """Execute ``cmd`` unless running in dry-run mode."""

        if self.dry_run:
            LOGGER.info("DRY-RUN: %s", " ".join(cmd))
            return None
        return run(cmd, check=True)

    def _run_git(self, *args: str) -> CompletedProcess | None:
        """Run a ``git`` command, respecting the dry-run flag."""

        return self._run("git", *args)

    def _local_branch_exists(self, branch: str) -> bool:
        """Return ``True`` if the local branch reference still exists."""

        if self.dry_run:
            return True
        result = run(
            ["git", "show-ref", "--verify", f"refs/heads/{branch}"],
            stdout=DEVNULL,
            stderr=DEVNULL,
            check=False,
        )
        return result.returncode == 0

    def delete_branch(self, branch: str) -> bool:
        """Delete ``branch`` locally and on ``origin``."""

        local_deleted = True
        try:
            self._run_git("branch", "-D", branch)
        except CalledProcessError:
            local_deleted = not self._local_branch_exists(branch)
            if not local_deleted:
                LOGGER.warning("Failed to delete local branch '%s'", branch)

        remote_deleted = True
        try:
            self._run_git("push", "origin", "--delete", branch)
        except CalledProcessError:
            remote_deleted = False
            LOGGER.warning("Failed to delete remote branch '%s'", branch)

        return local_deleted and remote_deleted

    def cleanup(self) -> Dict[str, bool]:
        """Delete all configured branches."""

        results: Dict[str, bool] = {}
        for branch in self._normalized_branches:
            results[branch] = self.delete_branch(branch)
        return results


def cleanup(branches: Iterable[str], dry_run: bool = False) -> Dict[str, bool]:
    """Convenience wrapper around :class:`CleanupBot`."""

    return CleanupBot(branches=branches, dry_run=dry_run).cleanup()


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
        LOGGER.error("%s", exc)
        return 1

    if not bot.branches:
        LOGGER.info("No merged branches to clean up.")
        return 0

    results = bot.cleanup()
    for branch, deleted in results.items():
        status = "deleted" if deleted else "failed"
        LOGGER.info("%s: %s", branch, status)

    successes = sum(1 for deleted in results.values() if deleted)
    failures = len(results) - successes
    LOGGER.info("Summary: %d deleted, %d failed", successes, failures)

    return 0 if failures == 0 else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
