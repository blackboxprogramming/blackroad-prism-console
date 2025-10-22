"""Simple auto novel agent example with creative and coding abilities."""
"""Simple auto novel agent example with game creation abilities.

This module defines :class:`AutoNovelAgent`, a minimal agent capable of
deploying itself, creating weapon‑free games, and now generating tiny novels
for demonstration purposes.
"""

import re
from dataclasses import dataclass
from typing import ClassVar, List, Set
from typing import ClassVar, Dict, List, Set
from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar
from dataclasses import dataclass, field
from typing import ClassVar
from dataclasses import dataclass, field
from typing import List, Set
from dataclasses import dataclass, field
from typing import List

DEFAULT_SUPPORTED_ENGINES = frozenset({"unity", "unreal"})


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
    supported_engines: set[str] = field(
        default_factory=lambda: {"unity", "unreal"}
    )
    """A toy agent that can deploy itself and create simple games."""
    """A toy agent that can deploy itself, create simple games, and write novels."""

    name: str = "AutoNovelAgent"
    gamma: float = 1.0
    supported_engines: ClassVar[set[str]] = {"unity", "unreal"}
    supported_engines: Set[str] = field(
        default_factory=lambda: {"unity", "unreal"}
    )
    supported_engines: set[str] = field(default_factory=lambda: set(DEFAULT_SUPPORTED_ENGINES))

    def __post_init__(self) -> None:
        """Normalise supported engine names to lowercase."""
        if not self.supported_engines:
            self.supported_engines = set(DEFAULT_SUPPORTED_ENGINES)
        else:
            self.supported_engines = {engine.lower() for engine in self.supported_engines}

    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""

        print(f"{self.name} deployed and ready to generate novels!")

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the engine is supported."""
        """Return ``True`` if the engine is supported.

        The check is case-insensitive.

        Args:
            engine: Name of the engine to verify.
        """

        return engine.lower() in self.SUPPORTED_ENGINES
    def _normalize_engine(self, engine: str) -> str:
        """Normalize an engine name to a lowercase, trimmed string.

        Args:
            engine: Engine name to normalize.

        Raises:
            ValueError: If the engine name is empty after normalization.
        """
        engine_lower = engine.strip().lower()
        if not engine_lower:
            raise ValueError("Engine name cannot be empty.")
        return engine_lower
        return engine.lower() in self.supported_engines
        return engine.lower() in self.SUPPORTED_ENGINES
        return engine.lower() in self.supported_engines

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine.

        Engines are stored in lowercase for case-insensitive matching.

        Args:
            engine: Name of the engine to allow.
        """
        self.supported_engines.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove an engine from the supported list.

        Args:
            engine: Name of the engine to remove. Lookup is case-insensitive.
        """
        self.supported_engines.discard(engine.lower())

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons."""

        Args:
            engine: Game engine to use.
            include_weapons: If ``True``, raise a ``ValueError`` because weapons
                are not allowed.
        """Create a basic game when given a supported engine name.

        Args:
            engine: Requested engine name. Accepts ``Unity`` or ``Unreal`` in a
                case-insensitive manner.
            include_weapons: Whether weapons should be included in the game.
                ``True`` triggers a ``ValueError`` because weapons are not
            engine: Game engine to use. Must be a non-empty string.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.

        Raises:
            ValueError: If the engine is not Unity/Unreal or weapons are
                requested.
        """

        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(
                f"Unsupported engine '{engine}'. Choose one of: {supported}."
            )
        if not engine or not engine.strip():
            raise ValueError("Engine name must be a non-empty string.")

        engine_clean = engine.strip()
        if not self.supports_engine(engine_clean):
        engine_lower = engine.strip().lower()
        if not engine_lower:
            raise ValueError("Engine name must be a non-empty string.")
        if engine_lower not in self.SUPPORTED_ENGINES:
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(
                "Unsupported engine "
                f"'{engine_clean}'. Supported engines: {supported}. "
                "Use ``add_supported_engine`` to register new engines."
            )

        engine_lower = engine_clean.lower()
        engine_lower = self._normalize_engine(engine)
        if engine_lower not in self.supported_engines:
        engine_lower = engine.lower()
        if not self.supports_engine(engine_lower):
        if engine_lower not in self.supported_engines:
            supported = ", ".join(sorted(self.supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")

        article = "an" if engine_lower == "unreal" else "a"
        print(
            f"Creating {article} {engine_lower.capitalize()} game without "
            "weapons..."
        )

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine."""

        Engines are stored in lowercase to keep lookups case-insensitive.

        Args:
            engine: Name of the engine to allow.
        """

        self.SUPPORTED_ENGINES.add(engine.lower())
        self.supported_engines.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove a game engine if it is currently supported."""

        Args:
            engine: Name of the engine to remove.
        """

        self.SUPPORTED_ENGINES.discard(engine.lower())
        """Remove a game engine from the supported list.

        Args:
            engine: Name of the engine to remove. The lookup is
                case-insensitive.

        Raises:
            ValueError: If the engine is not currently supported.
        """
        try:
            self.SUPPORTED_ENGINES.remove(engine.lower())
        except KeyError as exc:
            raise ValueError(f"Unsupported engine: {engine}.") from exc

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` if the provided engine is supported."""
        return engine.lower() in self.SUPPORTED_ENGINES

    def add_supported_engine(self, engine: str) -> None:
        """Add a new engine to the supported engines list.

        Args:
            engine: Name of the engine to add.
        """
        self.SUPPORTED_ENGINES.add(engine.lower())

    def remove_supported_engine(self, engine: str) -> None:
        """Remove an engine from the supported engines list if present.

        Args:
            engine: Name of the engine to remove.
        """
        self.SUPPORTED_ENGINES.discard(engine.lower())

    def generate_story(self, prompt: str, *, protagonist: str = "Hero") -> str:
        """Generate a short, deterministic story from a prompt.

        Args:
            prompt: Seed idea for the story.
            protagonist: Name of the main character in the story.

        Returns:
            A tiny story incorporating the protagonist and the prompt.
        """
        cleaned_prompt = prompt.strip()
        if not cleaned_prompt:
            raise ValueError("Prompt must not be empty.")
        return f"{cleaned_prompt} stars {protagonist} in a short tale."

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine.

        Args:
            engine: Name of the engine to allow. The value is stored in
                lowercase for case-insensitive matching.
        """
        engine_lower = engine.strip().lower()
        if not engine_lower:
            raise ValueError("Engine name must be a non-empty string.")
        self.SUPPORTED_ENGINES.add(engine_lower)

    def list_supported_engines(self) -> List[str]:
        """Return a sorted list of supported game engines."""
        self.SUPPORTED_ENGINES.discard(engine.lower())

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""

        return sorted(self.SUPPORTED_ENGINES)
    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self.supported_engines)

    def add_engine(self, engine: str) -> None:
        """Add a new game engine to the supported set.
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
        engine_lower = self._normalize_engine(engine)
        if engine_lower in self.supported_engines:
            raise ValueError("Engine already supported.")
        self.supported_engines.add(engine_lower)

    def generate_game_idea(self, theme: str, engine: str) -> str:
        """Return a short description for a themed game."""
        self.supported_engines.discard(engine.lower())

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""

        return sorted(self.supported_engines)

    def generate_game_idea(self, theme: str, engine: str) -> str:
        """Return a short description for a themed game."""

        Raises:
            ValueError: If ``theme`` is blank or ``engine`` unsupported.
        """

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

    def generate_story(
        self, theme: str, protagonist: str = "An adventurer"
    ) -> str:
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
    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story."""

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
        if not theme or not theme.strip():
            raise ValueError("Theme must be a non-empty string.")
        theme_clean = theme.strip()
        protagonist_clean = protagonist.strip()
        excitement = "!" * max(1, int(self.gamma))
        return (
            f"[{difficulty_normalized.title()}] Implement a solution that addresses "
            f"the '{topic_clean}' challenge. Describe your approach before coding "
            "and ensure the solution handles edge cases."
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

    def generate_novel(self, title: str, chapters: int = 1) -> List[str]:
        """Generate a lightweight novel outline.

        Args:
            title: Title for the novel.
            chapters: Number of chapters to create.

        Returns:
            A list of chapter strings forming the novel outline.
        """
        if chapters < 1:
            raise ValueError("`chapters` must be at least 1")
        outline = []
        for i in range(1, chapters + 1):
            outline.append(f"Chapter {i}: {title} — part {i}")
        return outline

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
    agent = AutoNovelAgent(gamma=2.0)
    agent.deploy()
    agent.create_game("unity")
    print(agent.generate_story("mystical", "A coder"))
    print(agent.generate_game_idea("mystical", "unity"))
    print(agent.generate_coding_challenge("graph traversal", "hard"))
    print(agent.generate_code_snippet("Implement depth-first search", "python"))
    print(agent.proofread_paragraph("this is a test paragraph it needs polish"))
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
    print(agent.generate_story("a mysterious forest"))
    for line in agent.generate_novel("The Journey", chapters=2):
        print(line)
    print(
        agent.write_short_story(
            "friendship", setting="a bustling spaceport", protagonist="Rin"
        )
    )
