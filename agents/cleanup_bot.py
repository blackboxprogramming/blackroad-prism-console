"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from subprocess import CalledProcessError
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Parameters
    ----------
    branches:
        A list of branch names to remove.
    dry_run:
        When ``True`` no commands are executed and planned actions are
        printed instead. This is helpful for verifying branch names before
        actual deletion.
    """

    branches: List[str]
    dry_run: bool = False

    def _run_git(self, *args: str) -> subprocess.CompletedProcess:
        """Execute a git command and return its completed process.

        Parameters
        ----------
        *args:
            Additional arguments passed directly to ``git``. These are appended
            to the base command in the order supplied so callers can specify
            any valid git subcommand and flags.

        Returns
        -------
        subprocess.CompletedProcess
            The completed process instance containing captured stdout and
            stderr for logging or debugging purposes.

        Raises
        ------
        subprocess.CalledProcessError
            Propagates when ``git`` exits with a non-zero status. The caller is
            expected to handle failures where appropriate.
        """
        return subprocess.run(["git", *args], check=True, capture_output=True, text=True)

    def delete_branch(self, branch: str) -> bool:
        """Attempt to delete a branch locally and remotely.

        Parameters
        ----------
        branch:
            The branch name slated for removal.

        Returns
        -------
        bool
            ``True`` when both local and remote deletions succeed. The method
            returns ``False`` if either deletion fails, logging a message for
            each unsuccessful attempt so callers can inspect the partial
            outcome.
        """
        success = True
        try:
            self._run_git("branch", "-D", branch)
        except CalledProcessError:
            print(f"Failed to delete local branch '{branch}'")
            success = False
        try:
            self._run_git("push", "origin", "--delete", branch)
        except CalledProcessError:
            print(f"Failed to delete remote branch '{branch}'")
            success = False
        return success

    def cleanup(self) -> Dict[str, bool]:
        """Attempt to remove each configured branch and report the outcome.

        Returns
        -------
        Dict[str, bool]
            Mapping of branch names to the success of their deletion attempts.
            In ``dry_run`` mode the method records ``True`` for every branch to
            indicate that the deletions would have been attempted without
            making changes.
        """
        results: Dict[str, bool] = {}
        for branch in self.branches:
            if self.dry_run:
                print(f"Would delete branch '{branch}' locally and remotely")
                results[branch] = True
                continue
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
