"""Utilities for loading and validating agent contracts."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Mapping, MutableMapping

import yaml


@dataclass(frozen=True)
class FieldSchema:
    """Schema definition for an input or output field."""

    id: str
    type: str
    required: bool = True
    description: str | None = None
    constraints: Mapping[str, Any] | None = None
    default: Any | None = None


@dataclass(frozen=True)
class SideEffect:
    """Declared side-effect for an agent."""

    type: str
    resource: str
    ops: List[str]


@dataclass(frozen=True)
class FailureMode:
    """Known failure mode for an agent."""

    id: str
    retryable: bool


@dataclass(frozen=True)
class AgentContract:
    """Represents the static contract for an agent."""

    name: str
    version: str
    inputs: List[FieldSchema] = field(default_factory=list)
    outputs: List[FieldSchema] = field(default_factory=list)
    side_effects: List[SideEffect] = field(default_factory=list)
    failure_modes: List[FailureMode] = field(default_factory=list)
    metadata: Mapping[str, Any] | None = None

    def input_by_id(self, field_id: str) -> FieldSchema | None:
        return next((field for field in self.inputs if field.id == field_id), None)

    def output_ids(self) -> List[str]:
        return [field.id for field in self.outputs]


class ContractRegistry:
    """Loads contracts and binds them to callable executors."""

    def __init__(self) -> None:
        self._contracts: Dict[str, AgentContract] = {}
        self._executors: Dict[str, Callable[[MutableMapping[str, Any]], Mapping[str, Any]]] = {}

    @property
    def contracts(self) -> Mapping[str, AgentContract]:
        return self._contracts

    def load_directory(self, directory: Path) -> None:
        for path in sorted(directory.glob("*.yaml")):
            contract = self._load_contract(path)
            self._contracts[contract.name] = contract

    def register_executor(
        self,
        agent_name: str,
        executor: Callable[[MutableMapping[str, Any]], Mapping[str, Any]],
    ) -> None:
        if agent_name not in self._contracts:
            raise KeyError(f"Contract for '{agent_name}' has not been loaded")
        self._executors[agent_name] = executor

    def get(self, agent_name: str) -> AgentContract:
        return self._contracts[agent_name]

    def executor_for(
        self, agent_name: str
    ) -> Callable[[MutableMapping[str, Any]], Mapping[str, Any]]:
        return self._executors[agent_name]

    @staticmethod
    def _load_contract(path: Path) -> AgentContract:
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle)

        def build_fields(section: Iterable[Mapping[str, Any]]) -> List[FieldSchema]:
            fields: List[FieldSchema] = []
            for item in section:
                fields.append(
                    FieldSchema(
                        id=item["id"],
                        type=item["type"],
                        required=item.get("required", True),
                        description=item.get("description"),
                        constraints=item.get("constraints"),
                        default=item.get("default"),
                    )
                )
            return fields

        def build_side_effects(section: Iterable[Mapping[str, Any]]) -> List[SideEffect]:
            side_effects: List[SideEffect] = []
            for item in section:
                side_effects.append(
                    SideEffect(
                        type=item["type"],
                        resource=item["resource"],
                        ops=list(item.get("ops", [])),
                    )
                )
            return side_effects

        def build_failure_modes(section: Iterable[Mapping[str, Any]]) -> List[FailureMode]:
            failures: List[FailureMode] = []
            for item in section:
                failures.append(
                    FailureMode(
                        id=item["id"],
                        retryable=bool(item.get("retryable", False)),
                    )
                )
            return failures

        return AgentContract(
            name=data["name"],
            version=data["version"],
            inputs=build_fields(data.get("inputs", [])),
            outputs=build_fields(data.get("outputs", [])),
            side_effects=build_side_effects(data.get("side_effects", [])),
            failure_modes=build_failure_modes(data.get("failure_modes", [])),
            metadata=data.get("observability"),
        )
