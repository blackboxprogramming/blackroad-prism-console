"""Entry point for ITBot GitHub Action workflow."""
from __future__ import annotations

from bots.it import ITBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="ITBot",
        bot_factory=ITBot,
        maintainers=["@blackboxprogramming/it", "@blackboxprogramming/maintainers"],
    )
