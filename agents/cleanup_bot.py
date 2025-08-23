"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Args:
        branches: Branch names to delete.
        dry_run: If True, print commands instead of executing them.
    """

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def cleanup(self) -> None:
        """Remove the configured branches locally and remotely.

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
