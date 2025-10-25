from __future__ import annotations

from typing import Dict

from .base import Connector
from .builtin_eval import EvalConnector
from .http_client import http_get, http_post
from .shell_exec import ShellConnector
from .slack_mock import SlackMockConnector
from .template import TemplateConnector


def build_registry() -> Dict[str, Connector]:
    connectors: Dict[str, Connector] = {}
    for connector in (
        EvalConnector(),
        http_get,
        http_post,
        SlackMockConnector(),
        ShellConnector(),
        TemplateConnector(),
    ):
        connectors[connector.name] = connector
    return connectors


REGISTRY = build_registry()


def get_connector(name: str) -> Connector:
    if name not in REGISTRY:
        raise KeyError(f"Connector {name} not registered")
    return REGISTRY[name]


__all__ = ["REGISTRY", "get_connector", "build_registry"]

