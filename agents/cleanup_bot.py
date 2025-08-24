"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from subprocess import CalledProcessError
from typing import List


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
    """

    branches: List[str]
    dry_run: bool = False

    def cleanup(self) -> None:
        """Remove the configured branches locally and remotely."""
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


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
