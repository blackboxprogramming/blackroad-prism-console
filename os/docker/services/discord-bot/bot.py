import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("discord-bot")

TOKEN = os.environ.get("DISCORD_BOT_TOKEN")


async def run_stub() -> None:
    LOGGER.info(
        "Starting Discord bot stub. Set DISCORD_BOT_TOKEN and replace bot implementation."
    )
    if TOKEN in (None, "changeme", ""):
        LOGGER.warning("No valid Discord token configured; running in noop mode")
    while True:
        await asyncio.sleep(60)


def main() -> None:
    asyncio.run(run_stub())


if __name__ == "__main__":
    main()
