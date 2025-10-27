"""Entry point for GTMBot GitHub Action workflow."""
from __future__ import annotations

from bots.gtm import GTMBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="GTMBot",
        bot_factory=GTMBot,
        maintainers=["@blackboxprogramming/gtm", "@blackboxprogramming/maintainers"],
    )
