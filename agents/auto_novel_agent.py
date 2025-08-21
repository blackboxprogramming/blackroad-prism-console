"""Simple auto novel agent example with game creation abilities."""
from dataclasses import dataclass


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself and create simple games."""

    name: str = "AutoNovelAgent"

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""
        print(f"{self.name} deployed and ready to generate novels!")

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using Unity or Unreal without weapons.

        Args:
            engine: Game engine to use ("unity" or "unreal").
            include_weapons: If True, raise a ValueError because weapons are not allowed.
        """
        engine_lower = engine.lower()
        if engine_lower not in {"unity", "unreal"}:
            raise ValueError("Unsupported engine. Choose 'unity' or 'unreal'.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        print(f"Creating a {engine_lower.capitalize()} game without weapons...")


if __name__ == "__main__":
    agent = AutoNovelAgent()
    agent.deploy()
    agent.create_game("unity")
