"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass, field


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    supported_engines: set[str] = field(
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
        engine_lower = engine.strip().lower()
        if engine_lower not in self.supported_engines:
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.supported_engines)

    def add_engine(self, engine: str) -> None:
        """Add a new game engine to the supported set.

        Args:
            engine: Name of the engine to add.

        Raises:
            ValueError: If the engine name is empty or already supported.
        """
        engine_lower = engine.strip().lower()
        if not engine_lower:
            raise ValueError("Engine name cannot be empty.")
        if engine_lower in self.supported_engines:
            raise ValueError("Engine already supported.")
        self.supported_engines.add(engine_lower)


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
