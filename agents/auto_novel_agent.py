"""Simple auto novel agent example with game creation abilities.

This module defines :class:`AutoNovelAgent`, a minimal agent capable of
deploying itself, creating weapon‑free games, and now generating tiny novels
for demonstration purposes.
"""

from dataclasses import dataclass
from typing import ClassVar, List


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself, create simple games, and write novels."""

    name: str = "AutoNovelAgent"
    SUPPORTED_ENGINES: ClassVar[set[str]] = {"unity", "unreal"}

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.
        """
        engine_lower = engine.lower()
        if engine_lower not in self.SUPPORTED_ENGINES:
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def generate_novel(self, title: str, chapters: int = 1) -> List[str]:
        """Generate a lightweight novel outline.

        Args:
            title: Title for the novel.
            chapters: Number of chapters to create.

        Returns:
            A list of chapter strings forming the novel outline.
        """
        if chapters < 1:
            raise ValueError("`chapters` must be at least 1")
        outline = []
        for i in range(1, chapters + 1):
            outline.append(f"Chapter {i}: {title} — part {i}")
        return outline


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    for line in agent.generate_novel("The Journey", chapters=2):
        print(line)
