"""Bot for cleaning up merged Git branches."""

from dataclasses import dataclass
from subprocess import CalledProcessError, run


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

    def delete_branch(self, branch: str) -> bool:
        """Delete a branch locally and remotely.

        Args:
            branch: The branch name to remove.

        Returns:
            True if the branch was deleted both locally and remotely, False otherwise.
        """
        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
            return True
        except CalledProcessError:
            return False

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
