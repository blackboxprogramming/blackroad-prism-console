"""Simple auto novel agent example with game creation abilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

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

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def write_novel(self, title: str, chapters: int = 3) -> list[str]:
        """Create a simple outline for a novel.

        Args:
            title: Title of the novel to draft.
            chapters: Number of chapter headings to generate.

        Returns:
            A list of generated chapter headings.
        """
        if chapters < 1:
            raise ValueError("Novel must have at least one chapter.")

        outline = [f"Chapter {i}: TBD" for i in range(1, chapters + 1)]
        print(f"Drafting novel '{title}' with {chapters} chapters...")
        for heading in outline:
            print(heading)
        return outline


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    agent.write_novel("The Adventure")
