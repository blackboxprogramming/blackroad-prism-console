"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess
from typing import List


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges."""

    branches: List[str]

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


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
