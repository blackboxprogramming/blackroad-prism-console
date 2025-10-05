"""Minimal orchestrator that plans and runs agent contracts."""
from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Any, Iterable, List, Mapping, MutableMapping, Sequence, Set

from .contract_models import AgentContract, ContractRegistry, FieldSchema

LOGGER = logging.getLogger(__name__)


class ContractValidationError(RuntimeError):
    """Raised when an agent input or output violates its contract."""


class PlanCompilationError(RuntimeError):
    """Raised when the orchestrator cannot produce a valid DAG for the goal."""


@dataclass
class PlanStep:
    """Single step in an agent execution plan."""

    agent_name: str


class SimpleOrchestrator:
    """Contract-driven orchestrator for deterministic agent execution."""

    def __init__(self, registry: ContractRegistry) -> None:
        self._registry = registry

    def compile_to_dag(
        self, goal_outputs: Sequence[str], available_keys: Iterable[str],
    ) -> List[PlanStep]:
        """Compile a simple DAG that fulfills ``goal_outputs``.

        The planner selects agents whose outputs intersect with the unresolved goal
        set and whose required inputs are already satisfied. The resulting list is
        ordered topologically.
        """

        resolved: Set[str] = set(available_keys)
        outstanding: Set[str] = set(goal_outputs) - resolved
        steps: List[PlanStep] = []
        used_agents: Set[str] = set()

        while outstanding:
            progress_made = False
            for contract in self._registry.contracts.values():
                if contract.name in used_agents:
                    continue
                output_ids = set(contract.output_ids())
                if not output_ids & outstanding:
                    continue
                if not self._inputs_available(contract, resolved):
                    continue
                steps.append(PlanStep(agent_name=contract.name))
                used_agents.add(contract.name)
                resolved.update(output_ids)
                outstanding.difference_update(output_ids)
                progress_made = True
            if not progress_made:
                raise PlanCompilationError(
                    "Unable to construct plan: insufficient inputs for remaining goals"
                )
        return steps

    def run_plan(
        self, goal_outputs: Sequence[str], context: MutableMapping[str, Any]
    ) -> MutableMapping[str, Any]:
        steps = self.compile_to_dag(goal_outputs, context.keys())
        for step in steps:
            contract = self._registry.get(step.agent_name)
            executor = self._registry.executor_for(step.agent_name)
            LOGGER.info("Running agent", extra={"agent": contract.name})
            self._validate_inputs(contract, context)
            before_hash = self._hash_subset(context, contract.inputs)
            outputs = executor(context)
            self._validate_outputs(contract, outputs)
            context.update(outputs)
            after_hash = self._hash_subset(outputs, contract.outputs)
            LOGGER.info(
                "Agent completed",
                extra={
                    "agent": contract.name,
                    "inputs_hash": before_hash,
                    "outputs_hash": after_hash,
                },
            )
        return context

    def _inputs_available(self, contract: AgentContract, resolved: Set[str]) -> bool:
        for field in contract.inputs:
            if field.required and field.id not in resolved:
                return False
        return True

    def _validate_inputs(
        self, contract: AgentContract, context: MutableMapping[str, Any]
    ) -> None:
        for field in contract.inputs:
            if field.required and field.id not in context:
                raise ContractValidationError(
                    f"Missing required input '{field.id}' for agent {contract.name}"
                )
            if field.id in context:
                self._validate_type(field, context[field.id], "input")

    def _validate_outputs(self, contract: AgentContract, outputs: Mapping[str, Any]) -> None:
        for field in contract.outputs:
            if field.id not in outputs:
                raise ContractValidationError(
                    f"Missing required output '{field.id}' from agent {contract.name}"
                )
            self._validate_type(field, outputs[field.id], "output")

    def _validate_type(self, field: FieldSchema, value: Any, direction: str) -> None:
        if not self._matches_type(field.type, value):
            raise ContractValidationError(
                f"{direction.title()} '{field.id}' expected {field.type} but received {type(value).__name__}"
            )

    def _matches_type(self, declared: str, value: Any) -> bool:
        if declared == "string":
            return isinstance(value, str)
        if declared == "integer":
            return isinstance(value, int)
        if declared == "boolean":
            return isinstance(value, bool)
        if declared == "object":
            return isinstance(value, dict)
        if declared.startswith("array[") and declared.endswith("]"):
            subtype = declared[len("array[") : -1]
            if not isinstance(value, list):
                return False
            return all(self._matches_type(subtype, item) for item in value)
        return True

    def _hash_subset(
        self, data: Mapping[str, Any], fields: Sequence[FieldSchema]
    ) -> str:
        subset = {field.id: data.get(field.id) for field in fields if field.id in data}
        encoded = json.dumps(subset, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()


__all__ = [
    "ContractValidationError",
    "PlanCompilationError",
    "PlanStep",
    "SimpleOrchestrator",
]
