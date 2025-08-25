"""Simple auto novel agent example with game creation abilities.

This module defines :class:`AutoNovelAgent`, a tiny demonstration agent that can
deploy itself, create weapon‑free games in supported engines, and draft novel
outlines.
"""

from dataclasses import dataclass
from typing import ClassVar, List


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself, create simple games and novels."""

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

    def generate_outline(self, topic: str, chapters: int = 3) -> List[str]:
        """Generate a simple chapter outline for a novel topic.

        Args:
            topic: Main theme for the novel.
            chapters: Number of chapters to produce. Must be positive.

        Returns:
            A list of chapter titles.

        Raises:
            ValueError: If ``chapters`` is less than 1.
        """
        if chapters < 1:
            raise ValueError("chapters must be at least 1")
        return [f"Chapter {i + 1}: {topic} Part {i + 1}" for i in range(chapters)]


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    for title in agent.generate_outline("Space Adventure", chapters=2):
        print(title)
