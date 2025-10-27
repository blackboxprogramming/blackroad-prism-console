"""Entry point for IndustryBot GitHub Action workflow."""
from __future__ import annotations

from bots.industry import IndustryBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="IndustryBot",
        bot_factory=IndustryBot,
        maintainers=["@blackboxprogramming/industry", "@blackboxprogramming/maintainers"],
    )
