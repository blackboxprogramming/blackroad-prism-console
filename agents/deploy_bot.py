"""Bot for deploying services via shell commands."""

from __future__ import annotations

from dataclasses import dataclass, field
import subprocess
from typing import List


@dataclass
class DeployBot:
    """Automate service deployments using subprocess calls."""

    commands: List[List[str]] = field(
        default_factory=lambda: [["echo", "deploy"], ["echo", "verify"]]
    )

    def deploy(self) -> None:
        """Run configured deployment commands sequentially."""
        for cmd in self.commands:
            subprocess.run(cmd, check=True)


if __name__ == "__main__":
    print("DeployBot ready to run deployments.")
