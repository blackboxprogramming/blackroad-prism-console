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
        """Execute a git command and return its result.

        Parameters
        ----------
        *args:
            Additional arguments passed directly to ``git``.

        Returns
        -------
        subprocess.CompletedProcess
            The completed process instance with captured output.
        """
        return subprocess.run(["git", *args], check=True, capture_output=True, text=True)

    def delete_branch(self, branch: str) -> bool:
        """Attempt to delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            ``True`` if the branch was deleted both locally and remotely, ``False``
            otherwise.
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
        """Attempt to remove the configured branches locally and remotely.

        Returns:
            Mapping of branch names to deletion success.
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
