"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from subprocess import CalledProcessError
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Attributes:
        branches: Branch names to delete.
        dry_run: If ``True``, print commands instead of executing them.
    """

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely."""
        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            return False

    def cleanup(self) -> Dict[str, bool]:
        """Remove the configured branches locally and remotely."""
        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
