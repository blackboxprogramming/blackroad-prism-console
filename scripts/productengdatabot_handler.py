"""Entry point for ProductEngDataBot GitHub Action workflow."""
from __future__ import annotations

from bots.product_eng_data import ProductEngDataBot

from scripts.bot_runner import execute_bot_workflow


if __name__ == "__main__":
    execute_bot_workflow(
        bot_name="ProductEngDataBot",
        bot_factory=ProductEngDataBot,
        maintainers=["@blackboxprogramming/product-eng-data", "@blackboxprogramming/maintainers"],
    )
