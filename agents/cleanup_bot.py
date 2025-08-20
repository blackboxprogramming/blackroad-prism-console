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
        """Remove the configured branches locally and remotely."""
        for branch in self.branches:
            subprocess.run(["git", "branch", "-D", branch], check=True)
            subprocess.run(["git", "push", "origin", "--delete", branch], check=True)


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
