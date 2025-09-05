"""Utility for removing merged Git branches.

This module provides a :class:`CleanupBot` dataclass that deletes branches
both locally and remotely. A ``dry_run`` flag prints the actions that would be
taken without executing any commands, making it safe to preview operations.
"""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError, CompletedProcess


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Parameters
    ----------
    branches:
        A list of branch names to remove.
    dry_run:
        When ``True`` no commands are executed and planned actions are printed
        instead.
    """

    branches: list[str]
    dry_run: bool = False

    def _run_git(self, *args: str) -> CompletedProcess:
        """Execute a git command and return the completed process.

        When ``dry_run`` is enabled the command is printed and a dummy
        :class:`CompletedProcess` with ``returncode`` 0 is returned instead of
        executing.
        """
        cmd = ["git", *args]
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
        """
        if self.dry_run:
            print(f"Would delete branch '{branch}' locally and remotely")
            return True
        try:
            self._run_git("branch", "-D", branch)
            self._run_git("push", "origin", "--delete", branch)
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
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")

