from __future__ import annotations

import json
import logging
from pathlib import Path

from config.settings import settings
from tools.storage import append_text

_LOG_PATH = Path("orchestrator/memory.jsonl")

logger = logging.getLogger(settings.APP_NAME)
if not logger.handlers:
    logger.setLevel(settings.LOG_LEVEL)
    stream = logging.StreamHandler()
    stream.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(stream)


def log(event: dict) -> None:
    line = json.dumps(event)
    logger.info(line)
    append_text(_LOG_PATH, line + "\n")
