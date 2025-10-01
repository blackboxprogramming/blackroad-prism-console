"""Bot for cleaning up merged Git branches."""

from __future__ import annotations

from dataclasses import dataclass
import subprocess


@dataclass
class CleanupBot:
    """Delete local and remote branches after merges.

    Args:
        branches: Branch names to remove.
        dry_run: If ``True``, print commands instead of executing them.
    """

    branches: list[str]
    dry_run: bool = False

    def _run(self, *cmd: str) -> None:
        """Run a command unless in dry-run mode."""
        if self.dry_run:
            print("DRY-RUN:", " ".join(cmd))
            return
        subprocess.run(cmd, check=True)

    def delete_branch(self, branch: str) -> dict[str, bool]:
        """Delete a branch locally and remotely.

        Returns:
            A mapping indicating success for ``"local"`` and ``"remote"``
            deletions.
        """
        results: dict[str, bool] = {"local": False, "remote": False}
        try:
            self._run("git", "branch", "-D", branch)
            results["local"] = True
        except subprocess.CalledProcessError:
            pass
        try:
            self._run("git", "push", "origin", "--delete", branch)
            results["remote"] = True
        except subprocess.CalledProcessError:
            pass
        return results

    def cleanup(self) -> dict[str, dict[str, bool]]:
        """Remove the configured branches locally and remotely."""
        results: dict[str, dict[str, bool]] = {}
        for branch in self.branches:
            results[branch] = self.delete_branch(branch)
        return results


if __name__ == "__main__":
    bot = CleanupBot(["example"], dry_run=True)
    print(bot.cleanup())
