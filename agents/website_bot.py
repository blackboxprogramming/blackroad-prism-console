"""Bot for automating site deployments and cache operations."""

from dataclasses import dataclass, field
import subprocess
from typing import List


@dataclass
class WebsiteBot:
    """Automate website deployment and cache management."""

    deploy_cmd: List[str] = field(default_factory=lambda: ["/deploy", "blackroad", "pages"])
    cache_purge_cmd: List[str] = field(default_factory=lambda: ["/cache", "purge"])
    cache_warm_cmd: List[str] = field(default_factory=lambda: ["/cache", "warm"])

    def deploy(self) -> None:
        """Deploy the website using the configured command."""
        subprocess.run(self.deploy_cmd, check=True)

    def purge_cache(self) -> None:
        """Purge the website cache."""
        subprocess.run(self.cache_purge_cmd, check=True)

    def warm_cache(self) -> None:
        """Warm the website cache."""
        subprocess.run(self.cache_warm_cmd, check=True)


if __name__ == "__main__":
    print("WebsiteBot ready to deploy and manage cache.")
