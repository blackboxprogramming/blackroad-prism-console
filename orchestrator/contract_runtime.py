"""Factory helpers for the contract-based orchestrator."""
from __future__ import annotations

from pathlib import Path
from .contract_models import ContractRegistry
from .executors import EXECUTOR_MAP
from .simple_orchestrator import SimpleOrchestrator


def build_registry(contracts_path: str | Path) -> ContractRegistry:
    """Load all contracts from ``contracts_path`` and bind executors."""

    registry = ContractRegistry()
    registry.load_directory(Path(contracts_path))
    for agent_name, executor in EXECUTOR_MAP.items():
        registry.register_executor(agent_name, executor)
    return registry


def build_orchestrator(contracts_path: str | Path) -> SimpleOrchestrator:
    """Create a :class:`SimpleOrchestrator` with loaded contracts."""

    registry = build_registry(contracts_path)
    return SimpleOrchestrator(registry)


__all__ = ["build_orchestrator", "build_registry"]
