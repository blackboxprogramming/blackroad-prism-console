from __future__ import annotations

import logging
import sys
from typing import Any, Dict

import structlog

from ..config import get_settings


settings = get_settings()


def configure_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso")
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.log_level.upper(), logging.INFO)),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
    )
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))


def bind_request(logger: structlog.stdlib.BoundLogger, **kwargs: Any) -> structlog.stdlib.BoundLogger:
    return logger.bind(**{k: v for k, v in kwargs.items() if v is not None})


def log_search(logger: structlog.stdlib.BoundLogger, payload: Dict[str, Any]) -> None:
    logger.info("search.completed", **payload)
