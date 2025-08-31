"""Simple auto novel agent example with game creation abilities."""

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

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the engine is supported.

        The check is case-insensitive.

        Args:
            engine: Name of the engine to verify.
        """
        return engine.lower() in self.SUPPORTED_ENGINES

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.
        """
        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine.

        Engines are stored in lowercase to keep lookups case-insensitive.

        Args:
            engine: Name of the engine to allow.
        """
        self.SUPPORTED_ENGINES.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove a game engine if it is currently supported.

        Args:
            engine: Name of the engine to remove.
        """
        self.SUPPORTED_ENGINES.discard(engine.lower())

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story.

        Args:
            theme: Central theme of the story.
            protagonist: Name or description of the main character.

        Returns:
            A short story string.

        Raises:
            ValueError: If ``theme`` is empty or only whitespace.
        """
        if not theme.strip():
            raise ValueError("Theme must be a non-empty string.")
        return (
            f"{protagonist} set out on a {theme} journey, discovering "
            f"wonders along the way."
        )


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
