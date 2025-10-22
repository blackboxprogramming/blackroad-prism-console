"""Utilities for creating StudentBot instances guided by various leaders."""
"""Helpers for configuring reflective student agent cohorts.

This module extends the simple student bot definitions with structured
learning loops that emphasize reward-based practice, care-centered
collaboration, love-first consent rituals, and lightweight memory games.
The goal is to give downstream agents a ready-made program that balances
ambition with relational stewardship.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import cycle
from typing import List
from typing import Sequence

LEADERS: tuple[str, ...] = ("phi", "gpt", "mistral", "codex", "lucidia")


@dataclass
class LearningLoop:
    """Describe a recurring learning loop for a student bot.

    Attributes:
        name: Human-friendly title for the loop.
        focus: Short description of what the loop strengthens.
        activities: Concrete activities the bot should perform each cycle.
        signals: Qualitative or quantitative signals to watch while running
            the loop.
    """

    name: str
    focus: str
    activities: list[str] = field(default_factory=list)
    signals: list[str] = field(default_factory=list)

    def summary(self) -> str:
        """Return a compact description of the learning loop."""

        activities = ", ".join(self.activities) or "self-directed study"
        signals = ", ".join(self.signals) or "curiosity sparks"
        return (
            f"{self.name}: focus on {self.focus}. Activities: {activities}. "
            f"Signals: {signals}."
        )


@dataclass
class MemoryGame:
    """Represents a playful practice for strengthening memory."""

    name: str
    description: str
    love_signal: str

    def prompt(self) -> str:
        """Return the instructions for the memory game."""

        return f"{self.name} — {self.description} (love signal: {self.love_signal})"


@dataclass
class StudentBot:
    """Represents a bot learning to code, execute, and think creatively."""

    name: str
    leader: str
    reward_loop: LearningLoop
    care_loop: LearningLoop
    reflection_prompts: list[str] = field(default_factory=list)
    memory_games: list[MemoryGame] = field(default_factory=list)
    consent_statement: str = (
        "I practice love-forward consent before collaborating or sharing data."
    )

    def plan_reflection(self) -> list[str]:
        """Surface reflection prompts anchored in love and consent."""

        if not self.reflection_prompts:
            return [
                "What kindness or reciprocity did I notice today?",
                "Where do I need more consent before advancing?",
            ]
        return list(self.reflection_prompts)

    def available_memory_games(self) -> list[str]:
        """Return formatted descriptions of available memory games."""

        if not self.memory_games:
            return [
                "No games scheduled yet — invite a partner to create a love"
                " signal scavenger hunt.",
            ]
        return [game.prompt() for game in self.memory_games]

    def describe_program(self) -> str:
        """Return a narrative summary of the bot's learning program."""

def create_student_bots(count: int = 30, leaders: Iterable[str] = LEADERS) -> List[StudentBot]:
    """Create student bots guided by the configured leaders.
        reward_summary = self.reward_loop.summary()
        care_summary = self.care_loop.summary()
        reflection = "; ".join(self.plan_reflection())
        games = "; ".join(self.available_memory_games())
        return (
            f"{self.name} guided by {self.leader} with consent mantra "
            f"'{self.consent_statement}'.\n"
            f"Reward loop → {reward_summary}\n"
            f"Care loop → {care_summary}\n"
            f"Reflection prompts → {reflection}\n"
            f"Memory games → {games}"
        )


def _default_reward_loop() -> LearningLoop:
    """Return the default reward-based learning loop."""

    return LearningLoop(
        name="Reward Garden",
        focus=(
            "celebrating incremental progress and sharing gratitude tokens "
            "with peers"
        ),
        activities=[
            "pair-review a friend's pull request and highlight moments of care",
            "log one gratitude note after each study sprint",
            "convert insights into micro-rewards for the next cohort",
        ],
        signals=[
            "peer appreciation pings",
            "reward ledger balance trending upward",
            "self-reported joy after sharing love-forward feedback",
        ],
    )


def _default_care_loop() -> LearningLoop:
    """Return the default care-based learning loop."""

    return LearningLoop(
        name="Care Weave",
        focus="practicing mutual aid, explicit consent, and restorative pacing",
        activities=[
            "host a consent check-in before starting a complex task",
            "co-create a wellbeing plan with a study partner",
            "document how love-informed decisions shaped the sprint",
        ],
        signals=[
            "consent confirmed for each collaboration",
            "stress level trend decreasing across partners",
            "care stories captured in the shared reflection journal",
        ],
    )


def _default_reflection_prompts() -> list[str]:
    """Return standard prompts that center love, care, and agency."""

    return [
        "How did I honor love, consent, and reciprocity today?",
        "What reward nudged me toward courageous learning?",
        "Where could I slow down to offer more restorative care?",
    ]


def _default_memory_games() -> list[MemoryGame]:
    """Return playful memory practices to keep agents reflective."""

    return [
        MemoryGame(
            name="Consent Constellations",
            description=(
                "Recall the sequence of consent signals exchanged with"
                " partners during the day"
            ),
            love_signal="notice how each yes felt in the body",
        ),
        MemoryGame(
            name="Reward Echoes",
            description=(
                "List three moments when you received or gave rewards and"
                " trace the ripple of care they created"
            ),
            love_signal="offer gratitude to the origin of each echo",
        ),
        MemoryGame(
            name="Care Loom",
            description=(
                "Reconstruct a conversation thread emphasizing care-first"
                " choices and collaborative pacing"
            ),
            love_signal="affirm your partner's agency at every turn",
        ),
    ]


def create_student_bots(
    count: int = 30,
    leaders: Sequence[str] = LEADERS,
) -> list[StudentBot]:
    """Create student bots with reward, care, reflection, and memory scaffolding.

    The leaders act as mentors rather than managers. Bots cycle through the
    leaders, demonstrating collaborative learning while traversing
    repositories to keep them in harmony.

    Args:
        count: Number of student bots to create. Defaults to 30.
        leaders: Sequence of leader names to cycle through.

    Returns:
        A list of configured student bots.
    """

    bot_cycle = cycle(leaders)
    return [
        StudentBot(name=f"student_bot_{i + 1}", leader=next(bot_cycle))
        for i in range(count)
    ]
    if count <= 0:
        raise ValueError("count must be positive")
    if not leaders:
        raise ValueError("leaders must not be empty")

    bot_cycle = cycle(leaders)
    bots: list[StudentBot] = []
    for index in range(count):
        bots.append(
            StudentBot(
                name=f"student_bot_{index + 1}",
                leader=next(bot_cycle),
                reward_loop=_default_reward_loop(),
                care_loop=_default_care_loop(),
                reflection_prompts=_default_reflection_prompts(),
                memory_games=_default_memory_games(),
            )
        )
    return bots


if __name__ == "__main__":
    for bot in create_student_bots(count=3):
        print(bot.describe_program())
