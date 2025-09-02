"""Simple auto novel agent example with game creation abilities."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import ClassVar


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    SUPPORTED_ENGINES: ClassVar[set[str]] = {"unity", "unreal"}
    games: list[str] = field(default_factory=list)

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")

    def create_game(self, engine: str, include_weapons: bool = False) -> str:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If ``True``, raise a ``ValueError`` because weapons are
                not allowed.

        Returns:
            The message describing the created game.
        """
        engine_lower = engine.lower()
        if engine_lower not in self.SUPPORTED_ENGINES:
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        message = f"Creating a {engine_lower.capitalize()} game without weapons..."
        print(message)
        self.games.append(engine_lower)
        return message

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def list_created_games(self) -> list[str]:
        """Return a list of engines used for created games.

        Returns:
            A copy of the internal list tracking created games.
        """
        return self.games.copy()


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    print(agent.list_created_games())
