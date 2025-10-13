"""Bot for cleaning up merged Git branches."""

from dataclasses import dataclass
from subprocess import CalledProcessError, DEVNULL, run


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
        run(cmd, check=True)

    def _local_branch_exists(self, branch: str) -> bool:
        """Return True if the local branch still exists."""
        if self.dry_run:
            return True

        result = run(
            ("git", "show-ref", "--verify", f"refs/heads/{branch}"),
            stdout=DEVNULL,
            stderr=DEVNULL,
            check=False,
        )
        return result.returncode == 0

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            True if the remote deletion succeeded and the local branch was
            removed or already absent, False otherwise.
        """
        local_deleted = True
        try:
            self._run("git", "branch", "-D", branch)
        except CalledProcessError:
            local_deleted = not self._local_branch_exists(branch)

        remote_deleted = True
        try:
            self._run("git", "push", "origin", "--delete", branch)
        except CalledProcessError:
            remote_deleted = False

        return local_deleted and remote_deleted

    def cleanup(self) -> dict[str, bool]:
        """Remove the configured branches locally and remotely.

        Returns:
            Mapping of branch names to deletion success.
        """
        results: dict[str, bool] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
