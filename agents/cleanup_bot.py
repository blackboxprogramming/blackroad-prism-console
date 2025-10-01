"""Simple helper for deleting Git branches locally and remotely."""

from __future__ import annotations

from dataclasses import dataclass, field
import subprocess
from subprocess import CalledProcessError
from typing import Dict, Iterable, List


@dataclass
class CleanupBot:
    """Delete local and remote Git branches.

    Parameters
    ----------
    branches:
        Iterable of branch names to delete.
    dry_run:
        When ``True``, commands are printed instead of executed.
    """

    branches: Iterable[str]
    dry_run: bool = False
    _normalized_branches: List[str] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._normalized_branches = list(self.branches)

    def _run(self, *cmd: str) -> None:
        """Run a git command unless in dry-run mode."""
        command = " ".join(cmd)
        if self.dry_run:
            print(f"DRY-RUN: {command}")
            return
        subprocess.check_call(cmd)

    def delete_branch(self, branch: str) -> bool:
        """Delete ``branch`` locally and on ``origin``.

        Returns ``True`` when both deletions succeed and ``False`` if an
        error occurs.
        """

        try:
            self._run("git", "branch", "-D", branch)
            self._run("git", "push", "origin", "--delete", branch)
        except CalledProcessError:
            print(f"Failed to delete branch: {branch}")
            return False
        return True

    def cleanup(self) -> Dict[str, bool]:
        """Delete all configured branches."""

        results: Dict[str, bool] = {}
        for branch in self._normalized_branches:
            results[branch] = self.delete_branch(branch)
        return results


def cleanup(branches: Iterable[str], dry_run: bool = False) -> Dict[str, bool]:
    """Convenience wrapper around :class:`CleanupBot`."""

    return CleanupBot(branches=branches, dry_run=dry_run).cleanup()
