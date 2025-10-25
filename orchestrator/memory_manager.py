"""Structured memory manager for orchestrating agent state."""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Mapping, MutableMapping, Optional

from lucidia.intelligence.events import make_event

import yaml


class MemoryConfigurationError(RuntimeError):
    """Raised when a memory configuration file is invalid."""


class MemoryOperationError(RuntimeError):
    """Raised when a memory operation cannot be applied."""


@dataclass
class ShortTermMemory:
    """Ephemeral memory store cleared on TTL expiration."""

    ttl_turns: int
    purpose: str
    _turns: int = 0
    _entries: List[Mapping[str, Any]] = field(default_factory=list)

    def append(self, record: Mapping[str, Any]) -> None:
        self._entries.append(dict(record))

    def tick(self) -> None:
        self._turns += 1
        if self._turns >= self.ttl_turns:
            self.purge()

    def purge(self) -> None:
        self._entries.clear()
        self._turns = 0

    def snapshot(self) -> List[Mapping[str, Any]]:
        return [dict(item) for item in self._entries]


@dataclass
class WorkingMemory:
    """Mutable working memory scoped to the current task episode."""

    keys: Iterable[str]
    _data: MutableMapping[str, Any] = field(default_factory=dict)

    def update(self, **values: Any) -> None:
        for key, value in values.items():
            self._data[key] = value

    def clear(self) -> None:
        self._data.clear()

    def snapshot(self) -> Dict[str, Any]:
        return dict(self._data)


@dataclass
class LongTermMemory:
    """Durable knowledge organized by schema paths."""

    schema: Iterable[str]
    _data: MutableMapping[str, Any] = field(default_factory=dict)

    def set_value(self, dotted_key: str, value: Any) -> None:
        parts = dotted_key.split(".") if dotted_key else []
        if not parts:
            raise MemoryOperationError("Long-term memory key cannot be empty")
        node = self._data
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node[parts[-1]] = value

    def pop_value(self, dotted_key: str) -> Any:
        parts = dotted_key.split(".") if dotted_key else []
        if not parts:
            raise MemoryOperationError("Long-term memory key cannot be empty")
        node = self._data
        for part in parts[:-1]:
            if part not in node or not isinstance(node[part], dict):
                raise MemoryOperationError(f"Key '{dotted_key}' not found in long-term memory")
            node = node[part]
        return node.pop(parts[-1], None)

    def snapshot(self) -> Dict[str, Any]:
        return deepcopy(self._data)


@dataclass
class MemoryConfig:
    short_term: ShortTermMemory
    working: WorkingMemory
    long_term: LongTermMemory

    @classmethod
    def from_yaml(cls, path: Path) -> "MemoryConfig":
        try:
            with path.open("r", encoding="utf-8") as handle:
                payload = yaml.safe_load(handle)
        except FileNotFoundError as exc:
            raise MemoryConfigurationError(f"Memory configuration not found: {path}") from exc
        if not isinstance(payload, dict) or "memory" not in payload:
            raise MemoryConfigurationError("Configuration must contain a 'memory' section")
        memory = payload["memory"]
        try:
            short_term_cfg = memory["short_term"]
            working_cfg = memory["working_memory"]
            long_term_cfg = memory["long_term"]
        except KeyError as exc:
            raise MemoryConfigurationError(f"Missing configuration key: {exc}") from exc
        short_term = ShortTermMemory(
            ttl_turns=int(short_term_cfg.get("ttl_turns", 50)),
            purpose=str(short_term_cfg.get("purpose", "")),
        )
        working = WorkingMemory(keys=tuple(working_cfg.get("keys", [])))
        long_term = LongTermMemory(schema=tuple(long_term_cfg.get("schema", [])))
        return cls(short_term=short_term, working=working, long_term=long_term)


class MemoryManager:
    """Coordinates short-, working-, and long-term memory for agents."""

    def __init__(
        self,
        config: MemoryConfig,
        *,
        event_dispatcher: Optional[Callable[[str, Mapping[str, Any]], None]] = None,
    ) -> None:
        self._config = config
        self._event_dispatcher = event_dispatcher

    @classmethod
    def from_yaml(
        cls,
        path: Path,
        *,
        event_dispatcher: Optional[Callable[[str, Mapping[str, Any]], None]] = None,
    ) -> "MemoryManager":
        return cls(MemoryConfig.from_yaml(path), event_dispatcher=event_dispatcher)

    def start_turn(self, context: Mapping[str, Any]) -> None:
        """Record the incoming message and increment TTL counters."""
        self._config.short_term.tick()
        if context:
            self._config.short_term.append(context)
        self._emit_event(
            topic="memory.deltas.turn",
            payload={
                "summary": "turn started",
                "context": context,
            },
        )

    def record_task_result(
        self,
        *,
        goal: str,
        constraints: Any | None = None,
        artifacts: Iterable[str] | None = None,
        open_questions: Iterable[str] | None = None,
    ) -> None:
        data: Dict[str, Any] = {"goal": goal}
        if constraints is not None:
            data["constraints"] = constraints
        if artifacts is not None:
            data["artifacts"] = list(artifacts)
        if open_questions is not None:
            data["open_questions"] = list(open_questions)
        self._config.working.update(**data)
        self._emit_event(
            topic="memory.deltas.task",
            payload={
                "summary": "task recorded",
                "details": data,
            },
        )

    def apply_op(self, operation: Mapping[str, Any]) -> None:
        op_type = operation.get("op")
        try:
            if op_type == "promote_to_long_term":
                self._apply_promote(operation)
            elif op_type == "demote_to_working":
                self._apply_demote(operation)
            elif op_type == "purge_short_term":
                self._config.short_term.purge()
            else:
                raise MemoryOperationError(f"Unsupported memory operation: {op_type}")
        except MemoryOperationError as exc:
            self._emit_event(
                topic="memory.deltas.apply",
                payload={
                    "summary": "memory operation failed",
                    "operation": dict(operation),
                    "status": "error",
                    "error": str(exc),
                },
            )
            raise
        else:
            self._emit_event(
                topic="memory.deltas.apply",
                payload={
                    "summary": "memory operation applied",
                    "operation": dict(operation),
                    "status": "ok",
                },
            )

    def hydrate_state(self) -> Dict[str, Any]:
        snapshot = {
            "short_term": self._config.short_term.snapshot(),
            "working_memory": self._config.working.snapshot(),
            "long_term": self._config.long_term.snapshot(),
        }
        self._emit_event(
            topic="memory.state.snapshot",
            payload={
                "summary": "memory hydrated",
                "state": snapshot,
            },
        )
        return snapshot

    def reset(self) -> None:
        self._config.short_term.purge()
        self._config.working.clear()
        self._config.long_term._data.clear()
        self._emit_event(
            topic="memory.state.reset",
            payload={"summary": "memory reset"},
        )

    def _apply_promote(self, operation: Mapping[str, Any]) -> None:
        data = operation.get("data")
        if not isinstance(data, Mapping) or "key" not in data:
            raise MemoryOperationError("promote_to_long_term requires a 'data.key'")
        key = str(data["key"])
        value = data.get("value")
        if value is None:
            # fall back to working memory value if present
            value = self._config.working.snapshot().get(key)
        self._config.long_term.set_value(key, value)

    def _apply_demote(self, operation: Mapping[str, Any]) -> None:
        data = operation.get("data")
        if not isinstance(data, Mapping) or "key" not in data:
            raise MemoryOperationError("demote_to_working requires a 'data.key'")
        key = str(data["key"])
        value = self._config.long_term.pop_value(key)
        if value is not None:
            self._config.working.update(**{key: value})

    def _emit_event(self, *, topic: str, payload: Mapping[str, Any]) -> None:
        if not self._event_dispatcher:
            return
        event = make_event(
            topic=topic,
            payload=payload,
            source="memory-manager",
            channel="memory",
        )
        self._event_dispatcher(event["topic"], event)


__all__ = [
    "MemoryConfigurationError",
    "MemoryOperationError",
    "MemoryConfig",
    "MemoryManager",
]
