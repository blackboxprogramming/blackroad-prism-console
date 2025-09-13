import logging
from typing import Any

from sdk import plugin_api
from . import registry
from .sandbox import run_in_sandbox, BotExecutionError

logger = logging.getLogger(__name__)


def route(bot_name: str, task: plugin_api.Task) -> Any:
    bot_cls = registry.get_bot(bot_name)
    if not bot_cls:
        raise ValueError(f"bot {bot_name} not found")
    bot = bot_cls()
    settings = plugin_api.get_settings()
    exec_mode = getattr(settings, "EXECUTION_MODE", "inproc")
    logger.info(
        "route",
        extra={
            "execution_mode": exec_mode,
            "lang": getattr(settings, "LANG", None),
            "theme": getattr(settings, "THEME", None),
        },
    )
    if exec_mode == "sandbox":
        return run_in_sandbox(lambda: bot.handle(task))
    return bot.handle(task)
