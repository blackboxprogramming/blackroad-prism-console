"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError


@dataclass(frozen=True, slots=True)
class CleanupResult:
    """Result of attempting to delete a branch."""

    local_deleted: bool
    remote_deleted: bool
    skipped: bool = False


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges."""

    branches: list[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def _execute(self, *cmd: str) -> bool:
        """Execute a command and return ``True`` when it succeeds."""
        try:
            self._run(*cmd)
        except CalledProcessError:
            return False
        return True

    def delete_branch(self, branch: str) -> CleanupResult:
        """Delete a branch locally and remotely."""
        if self.dry_run:
            print(f"Would delete branch '{branch}' locally and remotely")
            return CleanupResult(local_deleted=False, remote_deleted=False, skipped=True)
        local_deleted = self._execute("git", "branch", "-D", branch)
        remote_deleted = False
        if local_deleted:
            remote_deleted = self._execute("git", "push", "origin", "--delete", branch)
        return CleanupResult(local_deleted=local_deleted, remote_deleted=remote_deleted)

    def cleanup(self) -> dict[str, CleanupResult]:
        """Remove the configured branches locally and remotely.

        Returns:
            Mapping of branch names to deletion results.
        """
        results: dict[str, CleanupResult] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")

