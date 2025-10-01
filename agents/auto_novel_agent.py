"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass
from typing import ClassVar


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games or stories."""

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
            raise ValueError(
                f"Unsupported engine '{engine}'. Choose one of: {supported}."
            )
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def write_novel(self, title: str, protagonist: str) -> str:
        """Generate a minimal novel blurb.

        Args:
            title: Title of the story to generate.
            protagonist: Main character of the story.

        Returns:
            A short string describing the novel.
        """
        return f"{title} is a thrilling tale about {protagonist}."


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    print(agent.write_novel("Journey", "Alice"))
