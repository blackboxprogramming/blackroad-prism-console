"""Simple auto novel agent example with game creation abilities."""

from dataclasses import dataclass
from typing import ClassVar, List


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games.

    Attributes:
        name: Human-readable name of the agent.
        gamma: Creativity scaling factor. Higher values yield more excited
            stories.
    """

    name: str = "AutoNovelAgent"
    gamma: float = 1.0
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

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story.

        Args:
            theme: Central theme of the story. Must be a non-empty string.
            protagonist: Name or description of the main character.

        Returns:
            A short story string.

        Raises:
            ValueError: If ``theme`` is empty or whitespace.
        """
        if not theme or not theme.strip():
            raise ValueError("Theme must be a non-empty string.")
        theme_clean = theme.strip()
        protagonist_clean = protagonist.strip()
        excitement = "!" * max(1, int(self.gamma))
        return (
            f"{protagonist_clean} set out on a {theme_clean} journey, "
            f"discovering wonders along the way{excitement}"
        )

    def generate_story_series(
        self, themes: List[str], protagonist: str = "An adventurer"
    ) -> List[str]:
        """Generate a series of short stories for multiple themes.

        Args:
            themes: A list of themes. Each must be a non-empty string.
            protagonist: Name or description of the main character used for all
                stories.

        Returns:
            A list containing a short story for each provided theme.

        Raises:
            ValueError: If ``themes`` is empty or any theme is blank.
        """
        if not themes:
            raise ValueError("Themes list must not be empty.")
        stories: List[str] = []
        for theme in themes:
            if not theme or not theme.strip():
                raise ValueError("Each theme must be a non-empty string.")
            stories.append(self.generate_story(theme, protagonist))
        return stories

    def set_gamma(self, gamma: float) -> None:
        """Set the creativity scaling factor.

        Args:
            gamma: Positive scaling factor. Higher values increase excitement.

        Raises:
            ValueError: If ``gamma`` is not positive.
        """
        if gamma <= 0:
            raise ValueError("gamma must be positive.")
        self.gamma = gamma


if __name__ == "__main__":
    agent = AutoNovelAgent(gamma=2.0)
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
