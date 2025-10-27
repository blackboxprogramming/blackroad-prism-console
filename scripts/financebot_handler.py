"""Entry point for FinanceBot GitHub Action workflow."""
from __future__ import annotations

from bots.finance import FinanceBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="FinanceBot",
        bot_factory=FinanceBot,
        maintainers=["@blackboxprogramming/finance", "@blackboxprogramming/maintainers"],
    )
