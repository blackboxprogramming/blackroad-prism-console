"""Entry point for OpsBot GitHub Action workflow."""
from __future__ import annotations

from bots.ops import OpsBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="OpsBot",
        bot_factory=OpsBot,
        maintainers=["@blackboxprogramming/ops", "@blackboxprogramming/maintainers"],
    )
