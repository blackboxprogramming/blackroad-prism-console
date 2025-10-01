"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Args:
        branches: Branch names to delete.
        dry_run: When ``True`` the planned commands are printed instead of
            executed.
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

        results: Dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
