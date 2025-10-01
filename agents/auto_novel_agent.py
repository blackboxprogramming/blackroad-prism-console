"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass, field
from typing import List, Set


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    supported_engines: Set[str] = field(
        default_factory=lambda: {"unity", "unreal"}
    )

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
        if engine_lower not in self.supported_engines:
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.supported_engines)

    def add_engine(self, engine: str) -> None:
        """Add a new supported game engine.

        Args:
            engine: Name of the engine to add. Comparison is case-insensitive.

        """
        normalized_engine = engine.strip().lower()
        if not normalized_engine:
            raise ValueError("Engine name cannot be empty.")
        self.supported_engines.add(normalized_engine)


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
