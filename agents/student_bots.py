"""Definitions for student bots guided by leader agents."""

from dataclasses import dataclass
from itertools import cycle
from typing import List


@dataclass
class StudentBot:
    """Represents a bot learning to code, execute, and think novelly."""

    name: str
    leader: str


def create_student_bots() -> List[StudentBot]:
    """Create 30 student bots guided by phi, gpt, mistral, codex, and lucidia.

    The leaders act as mentors rather than managers. Bots cycle through the
    leaders, demonstrating collaborative learning while traversing repositories
    to keep them in harmony.
    """
    leaders = ["phi", "gpt", "mistral", "codex", "lucidia"]
    bot_cycle = cycle(leaders)
    return [StudentBot(name=f"student_bot_{i+1}", leader=next(bot_cycle)) for i in range(30)]


if __name__ == "__main__":
    for bot in create_student_bots():
        print(f"{bot.name} guided by leader {bot.leader}")
