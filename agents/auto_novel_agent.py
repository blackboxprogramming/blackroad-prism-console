"""Simple auto novel agent example with creative and coding abilities."""

import re
from dataclasses import dataclass
from typing import ClassVar, Dict, List, Set


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself, create games, and assist with English.

    Attributes:
        name: Human-readable name of the agent.
        gamma: Creativity scaling factor. Higher values yield more excited
            stories.
    """

    name: str = "AutoNovelAgent"
    gamma: float = 1.0
    SUPPORTED_ENGINES: ClassVar[Set[str]] = {"unity", "unreal"}
    SAMPLE_SNIPPETS: ClassVar[Dict[str, str]] = {
        "python": "def solve():\n    pass\n",
        "javascript": "function solve() {\n  return null;\n}\n",
        "java": "class Solution {\n    void solve() {\n    }\n}\n",
    }

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""

        print(f"{self.name} deployed and ready to generate novels!")

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the engine is supported."""

        return engine.lower() in self.SUPPORTED_ENGINES

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons."""

        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")
        article = "an" if engine_lower == "unreal" else "a"
        print(f"Creating {article} {engine_lower.capitalize()} game without weapons...")

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine."""

        self.SUPPORTED_ENGINES.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove a game engine if it is currently supported."""

        self.SUPPORTED_ENGINES.discard(engine.lower())

    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""

        return sorted(self.SUPPORTED_ENGINES)

    def generate_game_idea(self, theme: str, engine: str) -> str:
        """Return a short description for a themed game."""

        if not theme or not theme.strip():
            raise ValueError("Theme must be a non-empty string.")
        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
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
        self, themes: List[str], protagonist: str = "An adventurer"
    ) -> List[str]:
        """Generate a series of short stories for multiple themes."""

        if not themes:
            raise ValueError("Themes list must not be empty.")
        stories: List[str] = []
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

    # ------------------------------------------------------------------
    # Coding and English assistance abilities
    # ------------------------------------------------------------------
    def generate_coding_challenge(self, topic: str, difficulty: str = "medium") -> str:
        """Return a concise coding challenge prompt for the provided topic."""

        if not topic or not topic.strip():
            raise ValueError("Topic must be a non-empty string.")
        difficulty_normalized = difficulty.lower()
        if difficulty_normalized not in {"easy", "medium", "hard"}:
            raise ValueError("Difficulty must be 'easy', 'medium', or 'hard'.")
        topic_clean = topic.strip()
        return (
            f"[{difficulty_normalized.title()}] Implement a solution that addresses "
            f"the '{topic_clean}' challenge. Describe your approach before coding "
            "and ensure the solution handles edge cases."
        )

    def generate_code_snippet(self, description: str, language: str = "python") -> str:
        """Produce a starter code snippet in the requested language."""

        if not description or not description.strip():
            raise ValueError("Description must be provided for code generation.")
        language_lower = language.lower()
        snippet = self.SAMPLE_SNIPPETS.get(language_lower)
        if snippet is None:
            supported_languages = ", ".join(sorted(self.SAMPLE_SNIPPETS))
            raise ValueError(
                f"Unsupported language. Choose one of: {supported_languages}."
            )
        comment_prefix = "#" if language_lower == "python" else "//"
        return (
            f"{comment_prefix} TODO: {description.strip()}\n"
            f"{snippet}"
        )

    def improve_sentence(self, sentence: str) -> str:
        """Apply simple grammar fixes to a single sentence."""

        if not sentence or not sentence.strip():
            raise ValueError("Sentence must be a non-empty string.")
        trimmed = sentence.strip()
        capitalized = trimmed[0].upper() + trimmed[1:]
        if capitalized[-1] not in {".", "!", "?"}:
            capitalized += "."
        return " ".join(part for part in capitalized.split())

    def proofread_paragraph(self, paragraph: str) -> str:
        """Proofread a paragraph by applying :meth:`improve_sentence` to sentences."""

        if not paragraph or not paragraph.strip():
            raise ValueError("Paragraph must be a non-empty string.")
        sentences = [
            chunk.strip()
            for chunk in re.split(r"(?<=[.!?])\s+", paragraph.strip())
            if chunk.strip()
        ]
        if not sentences:
            raise ValueError("Paragraph must contain at least one sentence.")
        improved = [self.improve_sentence(sentence) for sentence in sentences]
        return " ".join(improved)


if __name__ == "__main__":
    agent = AutoNovelAgent(gamma=2.0)
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
    print(agent.generate_game_idea("mystical", "unity"))
    print(agent.generate_coding_challenge("graph traversal", "hard"))
    print(agent.generate_code_snippet("Implement depth-first search", "python"))
    print(agent.proofread_paragraph("this is a test paragraph it needs polish"))
