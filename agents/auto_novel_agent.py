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

    @classmethod
    def list_supported_engines(cls) -> list[str]:
        """Return a sorted list of supported game engines."""
        return sorted(cls.SUPPORTED_ENGINES)

    @classmethod
    def add_supported_engine(cls, engine: str) -> None:
        """Add a new supported engine shared across all agent instances.

        Args:
            engine: Name of the engine to add.

        Raises:
            ValueError: If the engine name is empty or already supported.
        """
        engine_normalized = engine.strip().lower()
        if not engine_normalized:
            raise ValueError("Engine name must be a non-empty string.")
        if engine_normalized in cls.SUPPORTED_ENGINES:
            raise ValueError("Engine already supported.")
        cls.SUPPORTED_ENGINES.add(engine_normalized)


if __name__ == "__main__":
    AutoNovelAgent.add_supported_engine("godot")
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("godot")
