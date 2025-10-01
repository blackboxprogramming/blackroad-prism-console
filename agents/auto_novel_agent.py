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

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def write_short_story(
        self, theme: str, *, setting: str | None = None, protagonist: str | None = None
    ) -> str:
        """Generate a short, three-sentence story for the given theme.

        Args:
            theme: The central theme of the story.
            setting: Optional setting to ground the story. If provided, it must be a
                non-empty string.
            protagonist: Optional protagonist for the story. If provided, it must be a
                non-empty string.

        Returns:
            A short story featuring the theme, optionally grounded in a setting and
            starring a protagonist.
        """
        clean_theme = theme.strip()
        if not clean_theme:
            raise ValueError("Theme must be provided.")

        clean_setting = setting.strip() if setting is not None else None
        if clean_setting is not None and not clean_setting:
            raise ValueError("Setting, when provided, must be non-empty.")

        clean_protagonist = protagonist.strip() if protagonist is not None else None
        if clean_protagonist is not None and not clean_protagonist:
            raise ValueError("Protagonist, when provided, must be non-empty.")

        hero = clean_protagonist or "a wanderer"
        hero_title = clean_protagonist or "A wanderer"

        if clean_setting:
            opening = f"In {clean_setting}, {hero} discovers a spark of {clean_theme}."
        else:
            opening = f"{hero_title} discovers a spark of {clean_theme}."

        conflict = (
            f"Challenges rise, but {hero} refuses to let {clean_theme} fade.".replace(
                "  ", " "
            )
        )
        resolution = f"In the end, {clean_theme} transforms the world around them."

        return " ".join([opening, conflict, resolution])


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
    print(
        agent.write_short_story(
            "friendship", setting="a bustling spaceport", protagonist="Rin"
        )
    )
