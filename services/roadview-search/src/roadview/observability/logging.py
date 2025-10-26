from __future__ import annotations

import logging
import sys
from typing import Any, Dict

import structlog


def configure_logging(level: str = "info") -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(message)s",
        stream=sys.stdout,
    )
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(**bindings: Dict[str, Any]) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger().bind(**bindings)
