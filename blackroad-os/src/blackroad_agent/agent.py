"""Core agent runtime."""

from __future__ import annotations

import asyncio
import importlib
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Optional

from anyio import create_task_group

from .config import PluginConfig, Settings
from .manifest import ActionCatalog
from .plugins.base import AgentPlugin
from .transport.base import Transport


@dataclass
class AgentContext:
    """Runtime context shared with plugins and transports."""

    settings: Settings
    actions: ActionCatalog
    loop: asyncio.AbstractEventLoop


class Agent:
    """Primary agent orchestrator responsible for bootstrapping components."""

    def __init__(self, settings: Settings, actions: ActionCatalog):
        self._settings = settings
        self._actions = actions
        self._loop = asyncio.get_event_loop()
        self._plugins: Dict[str, AgentPlugin] = {}
        self._transports: Dict[str, Transport] = {}

    @property
    def context(self) -> AgentContext:
        return AgentContext(settings=self._settings, actions=self._actions, loop=self._loop)

    def _import_symbol(self, dotted_path: str) -> Any:
        module_name, _, attr = dotted_path.partition(":")
        if not attr:
            module = importlib.import_module(module_name)
            if not hasattr(module, "Plugin"):
                raise RuntimeError(f"Module {module_name} must expose a Plugin class")
            return getattr(module, "Plugin")
        module = importlib.import_module(module_name)
        return getattr(module, attr)

    def load_plugins(self) -> None:
        for entry in self._settings.agent.plugins:
            plugin = self._instantiate_plugin(entry)
            self._plugins[entry.name] = plugin

    def _instantiate_plugin(self, config: PluginConfig) -> AgentPlugin:
        plugin_cls = self._import_symbol(config.module)
        plugin = plugin_cls(name=config.name, options=config.options, context=self.context)
        return plugin

    def _load_transports(self) -> None:
        for config in self._settings.agent.transports:
            module = importlib.import_module(f"blackroad_agent.transport.{config.type}")
            transport_cls = getattr(module, "TransportImpl")
            transport = transport_cls(config=config, agent=self)
            self._transports[config.type] = transport

    async def start(self) -> None:
        self.load_plugins()
        self._load_transports()
        async with create_task_group() as tg:
            for plugin in self._plugins.values():
                tg.start_soon(plugin.start)
            for transport in self._transports.values():
                tg.start_soon(transport.start)

    async def stop(self) -> None:
        async with create_task_group() as tg:
            for transport in self._transports.values():
                tg.start_soon(transport.stop)
            for plugin in self._plugins.values():
                tg.start_soon(plugin.stop)

    async def dispatch(self, action_id: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = payload or {}
        action = self._actions.by_id(action_id)
        plugin = self._plugins.get(action.plugin)
        if plugin is None:
            raise ValueError(f"No plugin registered for action {action.plugin}")
        return await plugin.execute(action_id=action_id, payload=payload)

    def plugins(self) -> Iterable[AgentPlugin]:
        return self._plugins.values()

    def transports(self) -> Iterable[Transport]:
        return self._transports.values()
