"""Simple auto novel agent example."""
from dataclasses import dataclass


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself."""

    name: str = "AutoNovelAgent"

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
