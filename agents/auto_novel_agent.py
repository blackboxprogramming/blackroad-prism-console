"""Simple auto novel agent example with creative and coding abilities."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import ClassVar, Iterable

DEFAULT_SUPPORTED_ENGINES: tuple[str, ...] = ("unity", "unreal")
from dataclasses import dataclass, field
from typing import ClassVar


@dataclass
class AutoNovelAgent:
    """A toy agent that can deploy itself, create games, and write stories."""

    name: str = "AutoNovelAgent"
    gamma: float = 1.0
    supported_engines: set[str] = field(
        default_factory=lambda: set(DEFAULT_SUPPORTED_ENGINES)
    )

    SAMPLE_SNIPPETS: ClassVar[dict[str, str]] = {
        "python": "def solve():\n    pass\n",
        "javascript": "function solve() {\n  return null;\n}\n",
        "java": "class Solution {\n    void solve() {\n    }\n}\n",
    }
    LEAST_PRIVILEGE_SCOPES: ClassVar[set[str]] = {"outline:read", "outline:write"}

    def __post_init__(self) -> None:
        if self.gamma <= 0:
            raise ValueError("gamma must be positive.")
        self.supported_engines = {
            self._normalize_engine(engine) for engine in self.supported_engines
        }

    # ------------------------------------------------------------------
    # Engine helpers
    # ------------------------------------------------------------------
    def _normalize_engine(self, engine: str) -> str:
        """Return a lowercase, trimmed engine name."""

        engine_normalized = engine.strip().lower()
        if not engine_normalized:
            raise ValueError("Engine name must be a non-empty string.")
        return engine_normalized

    def supports_engine(self, engine: str) -> bool:
        """Return ``True`` when ``engine`` is present in the supported set."""

        try:
            return self._normalize_engine(engine) in self.supported_engines
        except ValueError:
            return False
    _DEFAULT_ENGINES: ClassVar[tuple[str, ...]] = ("unity", "unreal")
    _supported_engines: set[str] = field(
        default_factory=lambda: set(AutoNovelAgent._DEFAULT_ENGINES)
    )

    @property
    def SUPPORTED_ENGINES(self) -> set[str]:
        """Return the set of engines supported by this agent instance."""
        return self._supported_engines

    def list_supported_engines(self) -> list[str]:
        """Return a sorted snapshot of supported engines."""

        return sorted(self.supported_engines)

    def add_supported_engine(self, engine: str) -> None:
        """Register a new game engine."""

        self.supported_engines.add(self._normalize_engine(engine))

    def remove_supported_engine(self, engine: str) -> None:
        """Remove a game engine, raising ``ValueError`` if it is unknown."""

        normalized = self._normalize_engine(engine)
        if normalized not in self.supported_engines:
            supported = ", ".join(self.list_supported_engines())
            raise ValueError(
                f"Cannot remove unsupported engine '{normalized}'. "
                f"Supported engines: {supported}."
            )
        self.supported_engines.remove(normalized)

    # ------------------------------------------------------------------
    # Primary abilities
    # ------------------------------------------------------------------
    def deploy(self) -> None:
        """Deploy the agent by printing a greeting."""

        print(f"{self.name} deployed and ready to generate novels!")

    def _indefinite_article(self, engine_name: str) -> str:
        """Return the appropriate indefinite article for ``engine_name``."""

        if not engine_name:
            return "a"
        lower = engine_name.lower()
        if lower.startswith(("honest", "hour", "heir")):
            return "an"
        return "an" if lower[0] in "aeiou" else "a"

    def _build_creation_message(self, engine_lower: str) -> str:
        """Build the message describing the created game."""

        article = self._indefinite_article(engine_lower)
        return f"Creating {article} {engine_lower.capitalize()} game without weapons..."

    def create_game(self, engine: str, include_weapons: bool = False) -> str:
        """Create a basic game using a supported engine."""

        normalized = self._normalize_engine(engine)
        if normalized not in self.supported_engines:
            supported = ", ".join(self.list_supported_engines())
            raise ValueError(
                "Unsupported engine "
                f"'{normalized}'. Supported engines: {supported}. "
                "Use add_supported_engine to register new engines."
            )
    def remove_supported_engine(self, engine: str) -> None:
        """Remove an engine from the supported list.

        Args:
            engine: Name of the engine to remove.

        Raises:
            ValueError: If the provided engine is not currently supported.
        """
        engine_lower = engine.lower()
        if engine_lower not in self.SUPPORTED_ENGINES:
            supported = ", ".join(sorted(self.SUPPORTED_ENGINES))
            raise ValueError(
                f"Engine '{engine}' is not supported. Choose one of: {supported}."
            )
        self.SUPPORTED_ENGINES.remove(engine_lower)

    def create_game(self, engine: str, include_weapons: bool = False) -> None:
        """Create a basic game using a supported engine without weapons.

        Args:
            engine: Game engine to use.
            include_weapons: If True, raise a ``ValueError`` because weapons are not
                allowed.
        """
        engine_lower = engine.lower()
        if engine_lower not in self._supported_engines:
            supported = ", ".join(sorted(self._supported_engines))
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")
        if include_weapons:
            raise ValueError("Weapons are not allowed in generated games.")

        message = self._build_creation_message(normalized)
        print(message)
        return message

    def generate_game_idea(self, theme: str, engine: str) -> str:
        """Return a short description for a themed game."""

        theme_clean = theme.strip()
        if not theme_clean:
            raise ValueError("Theme must be a non-empty string.")

        normalized = self._normalize_engine(engine)
        if normalized not in self.supported_engines:
            supported = ", ".join(self.list_supported_engines())
            raise ValueError(f"Unsupported engine. Choose one of: {supported}.")

        return (
            f"Imagine a {theme_clean} adventure crafted with "
            f"{normalized.capitalize()} where creativity reigns."
        )
    def list_supported_engines(self) -> List[str]:
        """Return a list of supported game engines."""
        return sorted(self.SUPPORTED_ENGINES)

    def generate_story(self, theme: str, protagonist: str = "An adventurer") -> str:
        """Generate a short themed story."""

        theme_clean = theme.strip()
        if not theme_clean:
            raise ValueError("Theme must be a non-empty string.")

        protagonist_clean = protagonist.strip() or "An adventurer"
        excitement = "!" * max(1, int(self.gamma))
        return (
            f"{protagonist_clean} set out on a {theme_clean} journey, "
            f"discovering wonders along the way{excitement}"
        )

    def generate_story_series(
        self, themes: Iterable[str], protagonist: str = "An adventurer"
    ) -> list[str]:
        """Generate short stories for each theme in ``themes``."""

        themes_list = list(themes)
        if not themes_list:
            raise ValueError("Themes list must not be empty.")

        stories: list[str] = []
        for theme in themes_list:
            if not theme or not str(theme).strip():
                raise ValueError("Each theme must be a non-empty string.")
            stories.append(self.generate_story(str(theme), protagonist))
        return stories

    def set_gamma(self, gamma: float) -> None:
        """Update the creativity scaling factor."""

        if gamma <= 0:
            raise ValueError("gamma must be positive.")
        self.gamma = gamma

    # ------------------------------------------------------------------
    # Coding and English assistance
    # ------------------------------------------------------------------
    def generate_coding_challenge(self, topic: str, difficulty: str = "medium") -> str:
        """Return a concise coding challenge prompt."""

        topic_clean = topic.strip()
        if not topic_clean:
            raise ValueError("Topic must be a non-empty string.")

        difficulty_normalized = difficulty.lower()
        if difficulty_normalized not in {"easy", "medium", "hard"}:
            raise ValueError("Difficulty must be 'easy', 'medium', or 'hard'.")

        return (
            f"[{difficulty_normalized.title()}] Implement a solution that addresses "
            f"the '{topic_clean}' challenge. Describe your approach before coding "
            "and ensure the solution handles edge cases."
        )

    def generate_code_snippet(self, description: str, language: str = "python") -> str:
        """Produce a starter code snippet in the requested language."""

        description_clean = description.strip()
        if not description_clean:
            raise ValueError("Description must be provided for code generation.")

        language_lower = language.lower()
        snippet = self.SAMPLE_SNIPPETS.get(language_lower)
        if snippet is None:
            supported_languages = ", ".join(sorted(self.SAMPLE_SNIPPETS))
            raise ValueError(
                f"Unsupported language. Choose one of: {supported_languages}."
            )

        comment_prefix = "#" if language_lower == "python" else "//"
        return f"{comment_prefix} TODO: {description_clean}\n{snippet}"

    def improve_sentence(self, sentence: str) -> str:
        """Apply simple grammar fixes to a single sentence."""

        trimmed = sentence.strip()
        if not trimmed:
            raise ValueError("Sentence must be a non-empty string.")

        capitalized = trimmed[0].upper() + trimmed[1:]
        if capitalized[-1] not in {".", "!", "?"}:
            capitalized += "."
        return " ".join(part for part in capitalized.split())

    def proofread_paragraph(self, paragraph: str) -> str:
        """Proofread a paragraph by improving individual sentences."""

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

    # ------------------------------------------------------------------
    # Story and policy helpers
    # ------------------------------------------------------------------
    def generate_novel(self, title: str, chapters: int = 1) -> list[str]:
        """Generate a lightweight novel outline."""

        title_clean = title.strip()
        if not title_clean:
            raise ValueError("Title must be a non-empty string.")
        if chapters < 1:
            raise ValueError("`chapters` must be at least 1")

        return [f"Chapter {i}: {title_clean} — part {i}" for i in range(1, chapters + 1)]

    def generate_novel_outline(self, title: str, chapters: int = 3) -> list[str]:
        """Generate a simple outline for a novel."""

        return self.generate_novel(title, chapters)

    def write_short_story(
        self,
        theme: str,
        *,
        setting: str | None = None,
        protagonist: str | None = None,
    ) -> str:
        """Generate a short, three-sentence story for the given theme."""

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
        hero_title = hero if clean_protagonist else "A wanderer"

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

    def validate_scopes(self, requested_scopes: Iterable[str]) -> None:
        """Validate that requested scopes adhere to the least-privilege policy."""

        invalid_scopes = sorted(set(requested_scopes) - self.LEAST_PRIVILEGE_SCOPES)
        if invalid_scopes:
            joined = ", ".join(invalid_scopes)
            raise ValueError(
                "Requested scopes exceed least-privilege policy. "
                f"Invalid scopes: {joined}."
            )
    def add_engine(self, engine: str) -> None:
        """Register a new supported game engine.

        Args:
            engine: Engine name to register.

        Raises:
            ValueError: If the engine name is invalid or already supported.
        """
        normalized = engine.strip().lower()
        if not normalized.isalpha():
            raise ValueError("Engine name must contain only letters.")
        if normalized in self._supported_engines:
            raise ValueError("Engine already supported.")
        self._supported_engines.add(normalized)

    def list_supported_engines(self) -> list[str]:
        """Return a list of supported game engines."""
        return sorted(self._supported_engines)


if __name__ == "__main__":
    agent = AutoNovelAgent(gamma=2.0)
    agent.deploy()
    agent.add_supported_engine("godot")
    agent.create_game("godot")
    print(agent.generate_story("mystical", "A coder"))
    print(agent.generate_game_idea("mystical", "unity"))
    print(agent.generate_coding_challenge("graph traversal", "hard"))
    print(agent.generate_code_snippet("Implement depth-first search", "python"))
    print(agent.proofread_paragraph("this is a test paragraph it needs polish"))
    for line in agent.generate_novel("The Journey", chapters=2):
        print(line)
    print(
        agent.write_short_story(
            "friendship", setting="a bustling spaceport", protagonist="Rin"
        )
    )
