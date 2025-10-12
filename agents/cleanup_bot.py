"""Utility bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
from subprocess import CalledProcessError, CompletedProcess, run
from typing import Dict, List


@dataclass
class CleanupBot:
    """Delete local and remote Git branches once work is merged."""

    branches: List[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> CompletedProcess | None:
        """Execute ``cmd`` unless running in dry-run mode."""

        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return None
        return run(cmd, check=True)

    def _run_git(self, *args: str) -> CompletedProcess | None:
        """Run a ``git`` command, respecting the dry-run setting."""

        return self._run("git", *args)

    def delete_branch(self, branch: str) -> bool:
        """Delete ``branch`` both locally and remotely.

        Returns ``True`` when the branch is deleted in both locations, ``False``
        otherwise.
        """

        success = True
        try:
            self._run_git("branch", "-D", branch)
        except CalledProcessError:
            print(f"Failed to delete local branch '{branch}'")
            success = False
        try:
            self._run_git("push", "origin", "--delete", branch)
        except CalledProcessError:
            print(f"Failed to delete remote branch '{branch}'")
            success = False
        return success

    def cleanup(self) -> Dict[str, bool]:
        """Attempt to delete every configured branch."""

        results: Dict[str, bool] = {}
        for branch in self.branches:
            if self.dry_run:
                print(f"Would delete branch '{branch}' locally and remotely")
                results[branch] = True
                continue
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    print("CleanupBot ready to delete branches.")
