"""Bot for cleaning up merged Git branches.

Provides :class:`CleanupBot` to delete local and remote branches after they
have been merged. Supports a dry-run mode to preview actions without
executing them.
"""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Parameters
    ----------
    branches:
        Branch names to remove.
    dry_run:
        If ``True`` commands are printed instead of executed.
    """

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run ``cmd`` unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Returns
        -------
        bool
            ``True`` if deletion succeeded both locally and remotely,
            ``False`` otherwise.
        """
        try:
            self._run("git", "branch", "-D", branch)
        except CalledProcessError:
            print(f"Local branch '{branch}' does not exist.")
            return False
        try:
            self._run("git", "push", "origin", "--delete", branch)
        except CalledProcessError:
            print(f"Remote branch '{branch}' does not exist.")
            return False
        return True

    def cleanup(self) -> Dict[str, bool]:
        """Remove configured branches locally and remotely."""
        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
