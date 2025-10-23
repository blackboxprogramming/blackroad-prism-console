"""Utility bot for cleaning up merged Git branches."""

from __future__ import annotations

import argparse
import logging
import subprocess
from dataclasses import dataclass
from subprocess import CalledProcessError
<<<<<<< main
from typing import List
import sys
from dataclasses import dataclass, field
from subprocess import CalledProcessError, CompletedProcess, DEVNULL, run
from typing import Dict, Iterable, List

LOGGER = logging.getLogger(__name__)
"""Utility for removing merged Git branches.

This module provides a :class:`CleanupBot` dataclass that deletes branches
both locally and remotely. A ``dry_run`` flag prints the actions that would be
taken without executing any commands, making it safe to preview operations.
"""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError, CompletedProcess
from subprocess import CalledProcessError
=======
from typing import Dict, List
>>>>>>> origin/codex/create-monorepo-structure-for-blackroad-foundation


@dataclass
class CleanupBot:
    """Delete local and remote Git branches once work is merged."""

    branches: Iterable[str]
    """Delete local and remote branches after merges.

    Parameters
    ----------
    branches:
        A list of branch names to remove.
    dry_run:
        When ``True`` no commands are executed and planned actions are printed
        instead.
    Args:
        branches: Branch names to delete.
        dry_run: When ``True`` the planned commands are printed instead of
            executed.
    Attributes:
        branches: Branch names to remove.
        dry_run: If True, print commands instead of executing them.
        When ``True`` no commands are executed and planned actions are
        printed instead. This is helpful for verifying branch names before
        actual deletion.
    """

    branches: list[str]
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
    def _run_git(self, *args: str) -> CompletedProcess:
        """Execute a git command and return the completed process.

        When ``dry_run`` is enabled the command is printed and a dummy
        :class:`CompletedProcess` with ``returncode`` 0 is returned instead of
        executing.
        """
        cmd = ["git", *args]
    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return subprocess.CompletedProcess(cmd, 0, "", "")
        return subprocess.run(cmd, check=True, capture_output=True, text=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Returns
        -------
        bool
            ``True`` if the branch was deleted both locally and remotely,
            ``False`` otherwise.
        Args:
            branch: The branch name to remove.

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            True if the branch was deleted locally and remotely, False otherwise.
            ``True`` if the branch was deleted both locally and remotely,
            ``False`` otherwise.
        """
        if self.dry_run:
            print(f"Would delete branch '{branch}' locally and remotely")
            return True
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
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            return False

    def cleanup(self) -> dict[str, bool]:
        """Remove the configured branches locally and remotely.

        Returns
        -------
        dict[str, bool]
            Mapping of branch names to deletion success.
        """
        results: dict[str, bool] = {}
        for branch in self.branches:
            if self.dry_run:
                print(f"Would delete branch '{branch}' locally and remotely")
                results[branch] = True
                continue
            try:
                subprocess.run(["git", "branch", "-D", branch], check=True)
            except CalledProcessError:
                print(f"Failed to delete local branch '{branch}'")
    def validate_environment(self) -> bool:
        """Verify the current repository is suitable for branch cleanup."""

        checks = (
            (
                ("git", "rev-parse", "--is-inside-work-tree"),
                "Not inside a Git work tree. Aborting cleanup.",
            ),
            (
                ("git", "remote", "get-url", "origin"),
                "Remote 'origin' is not configured. Aborting cleanup.",
            ),
        )
        for cmd, failure_message in checks:
            try:
                subprocess.run(
                    cmd,
                    check=True,
                    capture_output=True,
                    text=True,
                )
            except CalledProcessError:
                print(f"Failed to delete remote branch '{branch}'")
            results[branch] = self.delete_branch(branch)
        return results

            except CalledProcessError as error:
                print(failure_message)
                if error.stderr:
                    print(error.stderr.strip())
                return False
        return True

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            ``True`` if the branch was deleted both locally and remotely.
        """

        success = True
        commands = (
            ("git", "branch", "-D", branch),
            ("git", "push", "origin", "--delete", branch),
        )
        for cmd, failure_message in zip(
            commands,
            (
                f"Local branch '{branch}' does not exist.",
                f"Remote branch '{branch}' does not exist.",
            ),
        ):
            try:
                self._run(*cmd)
            except CalledProcessError:
                print(failure_message)
                success = False
        return success

    def cleanup(self) -> Dict[str, bool]:
        """Remove the configured branches locally and remotely."""

        if not self.validate_environment():
            return {branch: False for branch in self.branches}

        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results

def cleanup(branches: Iterable[str], dry_run: bool = False) -> Dict[str, bool]:
    """Convenience wrapper around :class:`CleanupBot`."""
            results[branch] = self.delete_branch(branch)
        return results
            success = self.delete_branch(branch)
            if not success:
                print(f"Failed to delete branch '{branch}' locally or remotely")
            results[branch] = success
        return results

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
if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")

