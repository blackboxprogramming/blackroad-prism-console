"""Simple auto novel agent example with game creation abilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"
    gamma: float = 1.0
    supported_engines: ClassVar[set[str]] = {"unity", "unreal"}

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""

        print(f"{self.name} deployed and ready to generate novels!")

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the engine is supported."""

        return engine.lower() in self.supported_engines

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons."""

        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        article = "an" if engine_lower == "unreal" else "a"
        print(f"Creating {article} {engine_lower.capitalize()} game without weapons...")

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine."""

        self.supported_engines.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove a game engine if it is currently supported."""

        self.supported_engines.discard(engine.lower())

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""

        return sorted(self.supported_engines)

    def generate_game_idea(self, theme: str, engine: str) -> str:
        """Return a short description for a themed game."""

        if not theme or not theme.strip():
            raise ValueError("Theme must be a non-empty string.")
        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        theme_clean = theme.strip()
        return (
            f"Imagine a {theme_clean} adventure crafted with "
            f"{engine_lower.capitalize()} where creativity reigns."
        )

    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story."""

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
        self, themes: list[str], protagonist: str = "An adventurer"
    ) -> list[str]:
        """Generate a series of short stories for multiple themes."""

        if not themes:
            raise ValueError("Themes list must not be empty.")
        stories: list[str] = []
        for theme in themes:
            if not theme or not theme.strip():
                raise ValueError("Each theme must be a non-empty string.")
            stories.append(self.generate_story(theme, protagonist))
        return stories

    def set_gamma(self, gamma: float) -> None:
        """Set the creativity scaling factor."""

        if gamma <= 0:
            raise ValueError("gamma must be positive.")
        self.gamma = gamma


if __name__ == "__main__":
    agent = AutoNovelAgent(gamma=2.0)
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
    print(agent.generate_game_idea("mystical", "unity"))
