"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass, field
from typing import List

DEFAULT_SUPPORTED_ENGINES = frozenset({"unity", "unreal"})


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    supported_engines: set[str] = field(default_factory=lambda: set(DEFAULT_SUPPORTED_ENGINES))

    def __post_init__(self) -> None:
        """Normalise supported engine names to lowercase."""
        if not self.supported_engines:
            self.supported_engines = set(DEFAULT_SUPPORTED_ENGINES)
        else:
            self.supported_engines = {engine.lower() for engine in self.supported_engines}

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the engine is supported.

        The check is case-insensitive.

        Args:
            engine: Name of the engine to verify.
        """
        return engine.lower() in self.supported_engines

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine.

        Engines are stored in lowercase for case-insensitive matching.

        Args:
            engine: Name of the engine to allow.
        """
        self.supported_engines.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove an engine from the supported list.

        Args:
            engine: Name of the engine to remove. Lookup is case-insensitive.
        """
        self.supported_engines.discard(engine.lower())

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.
        """
        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.supported_engines)

    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story.

        Args:
            theme: Central theme of the story.
            protagonist: Name or description of the main character.

        Returns:
            A short story string.
        """
        return f"{protagonist} set out on a {theme} journey, " "discovering wonders along the way."


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
