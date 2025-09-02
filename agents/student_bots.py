"""Definitions for student bots guided by leader agents."""

from collections.abc import Iterable
from dataclasses import dataclass
from itertools import cycle

LEADERS: tuple[str, ...] = ("phi", "gpt", "mistral", "codex", "lucidia")


@dataclass
class StudentBot:
    """Represents a bot learning to code, execute, and think novelly."""

    name: str
    leader: str


def create_student_bots(count: int = 30, leaders: Iterable[str] = LEADERS) -> list[StudentBot]:
    """Create student bots guided by phi, gpt, mistral, codex, and lucidia.

    The leaders act as mentors rather than managers. Bots cycle through the
    leaders, demonstrating collaborative learning while traversing repositories
    to keep them in harmony.

    Args:
        count: Number of student bots to create. Defaults to 30.
        leaders: Sequence of leader names to cycle through.

    Returns:
        A list of configured student bots.
    """
    bot_cycle = cycle(leaders)
    return [
        StudentBot(name=f"student_bot_{i+1}", leader=next(bot_cycle))
        for i in range(count)
    ]


if __name__ == "__main__":
    for bot in create_student_bots():
        print(f"{bot.name} guided by leader {bot.leader}")
