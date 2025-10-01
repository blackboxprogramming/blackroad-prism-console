"""Utilities for deleting merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import List


@dataclass(frozen=True)
class BranchCleanupResult:
    """Outcome of deleting a branch locally and remotely."""

    branch: str
    local_deleted: bool
    remote_deleted: bool

    @property
    def success(self) -> bool:
        """Return ``True`` when the branch was removed locally and remotely."""
        return self.local_deleted and self.remote_deleted


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges."""

    branches: List[str]
    dry_run: bool = False

    def _run_git(self, *args: str) -> tuple[bool, str | None]:
        """Execute a git command while respecting dry-run mode."""

        command = ["git", *args]
        if self.dry_run:
            print("DRY-RUN:", " ".join(command))
            return True, None
        try:
            subprocess.run(command, check=True, capture_output=True, text=True)
        except CalledProcessError as exc:
            stderr = exc.stderr.strip() if exc.stderr else None
            return False, stderr
        return True, None

    def _delete_local_branch(self, branch: str) -> tuple[bool, str | None]:
        """Delete a local branch."""

        return self._run_git("branch", "-D", branch)

    def _delete_remote_branch(self, branch: str) -> tuple[bool, str | None]:
        """Delete a remote branch from ``origin``."""

        return self._run_git("push", "origin", "--delete", branch)

    def cleanup(self) -> List[BranchCleanupResult]:
        """Remove the configured branches locally and remotely."""

        results: List[BranchCleanupResult] = []
        for branch in self.branches:
            local_deleted, local_error = self._delete_local_branch(branch)
            if not local_deleted and local_error:
                print(f"Failed to delete local branch '{branch}': {local_error}")

            remote_deleted, remote_error = self._delete_remote_branch(branch)
            if not remote_deleted and remote_error:
                print(f"Failed to delete remote branch '{branch}': {remote_error}")

            results.append(
                BranchCleanupResult(
                    branch=branch,
                    local_deleted=local_deleted,
                    remote_deleted=remote_deleted,
                )
            )
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
