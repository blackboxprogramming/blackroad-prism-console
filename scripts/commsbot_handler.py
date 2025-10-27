"""Entry point for CommsBot GitHub Action workflow."""
from __future__ import annotations

from bots.comms import CommsBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="CommsBot",
        bot_factory=CommsBot,
        maintainers=["@blackboxprogramming/comms", "@blackboxprogramming/maintainers"],
    )
