"""Role and permission utilities for the Prism agent framework."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import wraps
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Protocol, Sequence, Set

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = PROJECT_ROOT / "registry" / "agent_roles.json"


class RegistryIOError(RuntimeError):
    """Raised when the persistent registry cannot be accessed."""


@dataclass(frozen=True)
class AccessDecision:
    """Result returned by role checks."""

    allowed: bool
    reason: str
    role: Optional[str] = None
    permissions: Sequence[str] = ()


class RegistryBackend(Protocol):
    """Protocol for objects that can read and persist registry data."""

    def load(self) -> Dict[str, object]:
        ...

    def save(self, payload: Dict[str, object]) -> None:
        ...


class JsonRegistryBackend:
    """File-system backed registry implementation."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text(
                json.dumps({"agents": {}, "roles": {}, "access_matrix": {}}, indent=2),
                encoding="utf-8",
            )

    def load(self) -> Dict[str, object]:
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except OSError as exc:  # pragma: no cover - filesystem errors are environment-specific
            raise RegistryIOError(str(exc)) from exc

    def save(self, payload: Dict[str, object]) -> None:
        try:
            self.path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
        except OSError as exc:  # pragma: no cover - filesystem errors are environment-specific
            raise RegistryIOError(str(exc)) from exc


class RoleManager:
    """Central authority for role definitions and access checks."""

    def __init__(
        self,
        registry_path: Path | None = None,
        *,
        backend: RegistryBackend | None = None,
        audit_logger: Optional[object] = None,
    ) -> None:
        self.registry_path = registry_path or REGISTRY_PATH
        self.backend = backend or JsonRegistryBackend(self.registry_path)
        self.audit_logger = audit_logger
        self._registry = self.backend.load()
        self._roles: Dict[str, Dict[str, Iterable[str]]] = {
            role: info for role, info in self._registry.get("roles", {}).items()
        }
        self._access_matrix: Dict[str, Dict[str, Iterable[str]]] = {
            agent: {"allow": rules.get("allow", [])} for agent, rules in self._registry.get("access_matrix", {}).items()
        }
        self._agents: Dict[str, Dict[str, object]] = {
            agent: info for agent, info in self._registry.get("agents", {}).items()
        }

    # ------------------------------------------------------------------
    # Registry IO helpers
    # ------------------------------------------------------------------
    def _persist(self) -> None:
        payload = {
            "roles": self._roles,
            "access_matrix": self._access_matrix,
            "agents": self._agents,
        }
        self.backend.save(payload)

    # ------------------------------------------------------------------
    # Introspection helpers
    # ------------------------------------------------------------------
    def list_roles(self) -> List[str]:
        return sorted(self._roles.keys())

    def list_agents(self) -> List[str]:
        return sorted(self._agents.keys())

    def get_registry_snapshot(self) -> Dict[str, object]:
        return {
            "agents": json.loads(json.dumps(self._agents)),
            "roles": sorted(self._roles.keys()),
            "access_matrix": {
                agent: {"allow": sorted(rules.get("allow", []))}
                for agent, rules in self._access_matrix.items()
            },
        }

    # ------------------------------------------------------------------
    # Role management
    # ------------------------------------------------------------------
    def define_role(self, name: str, privileges: Iterable[str]) -> None:
        self._roles[name] = {"privileges": sorted(set(privileges))}
        self._persist()

    def assign_role(self, agent: str, role: str, *, homes: Optional[Iterable[str]] = None, actor: Optional[str] = None) -> None:
        if role not in self._roles:
            raise KeyError(f"Role '{role}' is not defined")
        entry = self._agents.setdefault(agent, {"role": role, "homes": []})
        entry["role"] = role
        if homes is not None:
            entry["homes"] = sorted(set(homes))
        self._persist()
        if self.audit_logger is not None:
            self.audit_logger.log(actor or "system", "agent.role.assign", "ok", {"agent": agent, "role": role})

    def set_access_rules(self, agent: str, *, allow: Iterable[str]) -> None:
        self._access_matrix[agent] = {"allow": sorted(set(allow))}
        self._persist()

    # ------------------------------------------------------------------
    # Access enforcement
    # ------------------------------------------------------------------
    def get_role_privileges(self, role: str) -> Set[str]:
        entry = self._roles.get(role)
        if not entry:
            return set()
        return set(entry.get("privileges", []))

    def check_agent_access(self, agent: str, platform: str, *, scope: Optional[str] = None) -> AccessDecision:
        info = self._agents.get(agent)
        if not info:
            return AccessDecision(False, "agent_not_registered")
        role = info.get("role")
        homes = set(info.get("homes", []))
        if platform not in homes:
            return AccessDecision(False, "platform_not_assigned", role, tuple(sorted(homes)))
        allow_list = set(self._access_matrix.get(agent, {}).get("allow", []))
        if platform not in allow_list:
            return AccessDecision(False, "platform_not_allowed", role, tuple(sorted(allow_list)))
        privileges = self.get_role_privileges(role)
        if scope and scope not in privileges:
            return AccessDecision(False, "insufficient_scope", role, tuple(sorted(privileges)))
        return AccessDecision(True, "ok", role, tuple(sorted(privileges)))


def require_permissions(*, agent_arg: str, platform: str, scope: Optional[str] = None) -> Callable[[Callable[..., object]], Callable[..., object]]:
    """Decorator for verifying agent permissions before executing a call."""

    def decorator(func: Callable[..., object]) -> Callable[..., object]:
        @wraps(func)
        def wrapper(*args, **kwargs):
            manager: RoleManager = kwargs.get("role_manager")  # type: ignore[assignment]
            if manager is None:
                raise RuntimeError("RoleManager must be provided via 'role_manager' keyword argument")
            agent_id = kwargs.get(agent_arg)
            if not isinstance(agent_id, str):
                raise ValueError(f"'{agent_arg}' must be passed as a keyword argument")
            decision = manager.check_agent_access(agent_id, platform, scope=scope)
            if not decision.allowed:
                raise PermissionError(decision.reason)
            return func(*args, **kwargs)

        return wrapper

    return decorator


__all__ = [
    "AccessDecision",
    "JsonRegistryBackend",
    "RegistryBackend",
    "RegistryIOError",
    "RoleManager",
    "require_permissions",
]
