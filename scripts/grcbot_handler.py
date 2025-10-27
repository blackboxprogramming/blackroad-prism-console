"""Entry point for GRCBot GitHub Action workflow."""
from __future__ import annotations

from bots.grc import GRCBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="GRCBot",
        bot_factory=GRCBot,
        maintainers=["@blackboxprogramming/grc", "@blackboxprogramming/maintainers"],
    )
