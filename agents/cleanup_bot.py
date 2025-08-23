"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges."""

    branches: List[str]

    def _run_git(self, *args: str) -> subprocess.CompletedProcess:
        """Execute a git command with ``check=True`` and captured output."""
        return subprocess.run(["git", *args], check=True, capture_output=True, text=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            ``True`` if the branch was deleted both locally and remotely, ``False``
            otherwise.
        """
        try:
            self._run_git("branch", "-D", branch)
            self._run_git("push", "origin", "--delete", branch)
            return True
        except subprocess.CalledProcessError:
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


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
