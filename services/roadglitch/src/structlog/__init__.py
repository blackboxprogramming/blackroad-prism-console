from __future__ import annotations

import logging
from typing import Any, Dict


def configure(*, processors=None, wrapper_class=None, cache_logger_on_first_use=True) -> None:
    logging.basicConfig(level=logging.INFO)


def get_logger(name: str) -> "BoundLogger":
    return BoundLogger(name)


class BoundLogger:
    def __init__(self, name: str) -> None:
        self._logger = logging.getLogger(name)

    def bind(self, **kwargs: Any) -> "BoundLogger":
        return self

    def info(self, event: str, **kwargs: Any) -> None:
        self._logger.info("%s %s", event, kwargs)

    def warning(self, event: str, **kwargs: Any) -> None:
        self._logger.warning("%s %s", event, kwargs)

    def error(self, event: str, **kwargs: Any) -> None:
        self._logger.error("%s %s", event, kwargs)


class processors:  # type: ignore[too-many-ancestors]
    @staticmethod
    def add_log_level(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        event_dict["level"] = method_name
        return event_dict

    @staticmethod
    def TimeStamper(fmt: str = "iso") -> Any:
        def processor(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
            return event_dict

        return processor

    @staticmethod
    def JSONRenderer() -> Any:
        def renderer(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> str:
            return str(event_dict)

        return renderer


def make_filtering_bound_logger(level: int) -> Any:
    return BoundLogger


__all__ = ["configure", "get_logger", "processors", "make_filtering_bound_logger"]

