"""Entry point for RegionalBot GitHub Action workflow."""
from __future__ import annotations

from bots.regional import RegionalBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="RegionalBot",
        bot_factory=RegionalBot,
        maintainers=["@blackboxprogramming/regional", "@blackboxprogramming/maintainers"],
    )
