"""Bot for cleaning up merged Git branches."""

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
        A list of branch names to remove.
    dry_run:
        When ``True`` no commands are executed and planned actions are printed
        instead.
    """

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def _run_git(self, *args: str) -> subprocess.CompletedProcess:
        """Execute a git command with ``check=True`` and captured output."""
        return subprocess.run(
            ["git", *args], check=True, capture_output=True, text=True
        )

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Returns
        -------
        bool
            ``True`` if the branch was deleted both locally and remotely,
            ``False`` otherwise.
        """
        try:
            self._run_git("branch", "-D", branch)
            self._run_git("push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            return False

    def cleanup(self) -> Dict[str, bool]:
        """Remove the configured branches locally and remotely.

        Returns
        -------
        Dict[str, bool]
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

