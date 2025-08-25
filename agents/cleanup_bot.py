"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import List
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
    Args:
        branches: Branch names to delete.
        dry_run: If True, print commands instead of executing them.
    """

    branches: List[str]
    dry_run: bool = False

    def _run_git(self, *args: str) -> subprocess.CompletedProcess:
        """Execute a git command with ``check=True`` and captured output."""
        return subprocess.run(["git", *args], check=True, capture_output=True, text=True)

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.
    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

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
            if self.dry_run:
                print(f"Would delete branch '{branch}' locally and remotely")
                continue
            try:
                subprocess.run(["git", "branch", "-D", branch], check=True)
            except CalledProcessError:
                print(f"Failed to delete local branch '{branch}'")
            try:
                subprocess.run(
                    ["git", "push", "origin", "--delete", branch],
                    check=True,
                )
            except CalledProcessError:
                print(f"Failed to delete remote branch '{branch}'")
            results[branch] = self.delete_branch(branch)
        return results
    def cleanup(self) -> None:
        """Remove the configured branches locally and remotely.

        Branches missing either locally or remotely are skipped with a message.
        """
        for branch in self.branches:
            try:
                subprocess.run(["git", "branch", "-D", branch], check=True)
            except subprocess.CalledProcessError:
                print(f"Local branch '{branch}' does not exist.")
            try:
                subprocess.run(
                    ["git", "push", "origin", "--delete", branch], check=True
                )
            except subprocess.CalledProcessError:
                print(f"Remote branch '{branch}' does not exist.")
        Skips branches that are missing locally or remotely.
        """
        for branch in self.branches:
            try:
                self._run("git", "branch", "-D", branch)
            except CalledProcessError:
                print(f"Local branch {branch} not found; skipping")
            try:
                self._run("git", "push", "origin", "--delete", branch)
            except CalledProcessError:
                print(f"Remote branch {branch} not found; skipping")


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
