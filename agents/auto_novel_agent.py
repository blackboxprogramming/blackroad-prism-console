"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass
from typing import ClassVar, List


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    SUPPORTED_ENGINES: ClassVar[set[str]] = {"unity", "unreal"}

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")

    def create_game(self, engine: str, include_weapons: bool = False) -> str:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.

        Returns:
            The message describing the created game, which is also printed for
            interactive use.
        """
        engine_lower = engine.lower()
        if engine_lower not in self.SUPPORTED_ENGINES:
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")

        message = self._build_creation_message(engine_lower)
        print(message)
        return message

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def _build_creation_message(self, engine_lower: str) -> str:
        """Build the message used when creating a game.

        Args:
            engine_lower: The engine name in lowercase.

        Returns:
            The formatted message indicating the game creation action.
        """
        article = self._indefinite_article(engine_lower)
        engine_name = engine_lower.capitalize()
        return f"Creating {article} {engine_name} game without weapons..."

    @staticmethod
    def _indefinite_article(engine_name: str) -> str:
        """Return the appropriate indefinite article for ``engine_name``."""
        if not engine_name:
            return "a"

        lower = engine_name.lower()
        if lower.startswith("uni"):
            return "a"
        if lower[0] in "aeiou":
            return "an"
        if lower.startswith("honest") or lower.startswith("hour") or lower.startswith("heir"):
            return "an"
        return "a"


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
