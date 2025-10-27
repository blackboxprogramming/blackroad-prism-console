"""Entry point for PeopleBot GitHub Action workflow."""
from __future__ import annotations

from bots.people import PeopleBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="PeopleBot",
        bot_factory=PeopleBot,
        maintainers=["@blackboxprogramming/people", "@blackboxprogramming/maintainers"],
    )
