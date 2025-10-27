"""Utilities for coordinating a lightweight agent mesh.

The mesh is centred around a *root agent* that maintains the canonical
repository and distributes verified updates to downstream nodes.  Nodes report
heartbeats to the root, which persistently records their status in a
``registry.json`` file.  The helpers in this module focus on the bookkeeping
aspects of that workflow so callers can plug in their own transport and
validation layers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Mapping, Optional


def _utcnow() -> datetime:
    """Return the current time as an aware UTC ``datetime``."""

    return datetime.now(timezone.utc)


def _to_iso(dt: datetime) -> str:
    """Serialise a timezone-aware ``datetime`` to an ISO 8601 string."""

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse_iso(value: str) -> datetime:
    """Parse an ISO 8601 timestamp produced by :func:`_to_iso`."""

    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value)


@dataclass(slots=True)
class NodeHeartbeat:
    """Payload emitted by an agent when it checks in with the root."""

    id: str
    role: str
    status: str
    supervisor: Optional[str] = None
    version: Optional[str] = None
    timestamp: datetime = field(default_factory=_utcnow)


@dataclass(slots=True)
class NodeRecord:
    """A persisted representation of a node within the mesh."""

    id: str
    role: str
    status: str
    last_seen: datetime
    supervisor: Optional[str] = None
    version: Optional[str] = None

    def to_dict(self) -> Dict[str, str | None]:
        """Convert the record into a JSON-serialisable mapping."""

        payload: Dict[str, str | None] = {
            "id": self.id,
            "role": self.role,
            "status": self.status,
            "last_seen": _to_iso(self.last_seen),
        }
        if self.supervisor is not None:
            payload["supervisor"] = self.supervisor
        if self.version is not None:
            payload["version"] = self.version
        return payload

    @classmethod
    def from_dict(cls, payload: Mapping[str, object]) -> "NodeRecord":
        """Hydrate a record from a JSON mapping."""

        return cls(
            id=str(payload["id"]),
            role=str(payload["role"]),
            status=str(payload["status"]),
            last_seen=_parse_iso(str(payload["last_seen"])),
            supervisor=str(payload["supervisor"])
            if payload.get("supervisor") is not None
            else None,
            version=str(payload["version"]) if payload.get("version") is not None else None,
        )


class MeshRegistry:
    """In-memory representation of the mesh registry on disk."""

    def __init__(
        self,
        path: Path | str,
        *,
        network: str = "blackroad-mesh",
        version: Optional[str] = None,
        updated: Optional[datetime] = None,
    ) -> None:
        self.path = Path(path)
        self.network = network
        self.version = version
        self.updated = updated or _utcnow()
        self._nodes: Dict[str, NodeRecord] = {}

    # ------------------------------------------------------------------
    # Factory helpers
    # ------------------------------------------------------------------
    @classmethod
    def load(cls, path: Path | str, *, network: str = "blackroad-mesh") -> "MeshRegistry":
        """Load an existing registry or create a new one if missing."""

        path = Path(path)
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            registry = cls(
                path,
                network=str(data.get("network", network)),
                version=str(data["version"]) if data.get("version") is not None else None,
                updated=_parse_iso(str(data["updated"])) if data.get("updated") else _utcnow(),
            )
            for entry in data.get("nodes", []):
                record = NodeRecord.from_dict(entry)
                registry._nodes[record.id] = record
            return registry

        registry = cls(path, network=network)
        registry.save()  # bootstrap the file on disk for visibility
        return registry

    # ------------------------------------------------------------------
    # Query helpers
    # ------------------------------------------------------------------
    def get(self, node_id: str) -> Optional[NodeRecord]:
        """Return the record for *node_id* if known."""

        return self._nodes.get(node_id)

    def nodes(self, *, status: str | Iterable[str] | None = None) -> List[NodeRecord]:
        """Return all records, optionally filtered by status."""

        if status is None:
            selected = list(self._nodes.values())
        else:
            statuses = {status} if isinstance(status, str) else set(status)
            selected = [record for record in self._nodes.values() if record.status in statuses]
        return sorted(selected, key=lambda record: record.id)

    def node_count(self, *, status: str | Iterable[str] | None = None) -> int:
        """Return the number of known nodes, optionally filtered by status."""

        return len(self.nodes(status=status))

    # ------------------------------------------------------------------
    # Mutation helpers
    # ------------------------------------------------------------------
    def update_from_heartbeat(self, heartbeat: NodeHeartbeat) -> NodeRecord:
        """Insert or update a node using the supplied heartbeat."""

        record = self._nodes.get(heartbeat.id)
        if record is None:
            record = NodeRecord(
                id=heartbeat.id,
                role=heartbeat.role,
                status=heartbeat.status,
                supervisor=heartbeat.supervisor,
                version=heartbeat.version,
                last_seen=heartbeat.timestamp,
            )
        else:
            record.role = heartbeat.role
            record.status = heartbeat.status
            record.supervisor = heartbeat.supervisor or record.supervisor
            record.version = heartbeat.version or record.version
            record.last_seen = heartbeat.timestamp
        self._nodes[record.id] = record
        self.updated = max(self.updated, heartbeat.timestamp)
        return record

    def set_version(self, version: str) -> None:
        """Update the mesh's canonical build version."""

        self.version = version
        self.updated = _utcnow()

    def prune(self, predicate: Callable[[NodeRecord], bool]) -> List[NodeRecord]:
        """Remove nodes for which *predicate* returns ``True``."""

        removed: List[NodeRecord] = []
        for node_id, record in list(self._nodes.items()):
            if predicate(record):
                removed.append(self._nodes.pop(node_id))
        if removed:
            self.updated = _utcnow()
        return removed

    def save(self) -> None:
        """Persist the registry to disk."""

        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "network": self.network,
            "updated": _to_iso(self.updated),
            "version": self.version,
            "nodes": [record.to_dict() for record in self.nodes()],
        }
        self.path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------
    def summary(self) -> Mapping[str, object]:
        """Return a lightweight overview of the mesh state."""

        return {
            "network": self.network,
            "version": self.version,
            "updated": _to_iso(self.updated),
            "total_nodes": self.node_count(),
            "active_nodes": self.node_count(status="active"),
        }


class RootAgent:
    """Coordinator that maintains the canonical mesh registry."""

    def __init__(self, registry: MeshRegistry, *, version_resolver: Callable[[], str]) -> None:
        self.registry = registry
        self._version_resolver = version_resolver

    def register_heartbeat(self, heartbeat: NodeHeartbeat) -> NodeRecord:
        """Persist a node heartbeat and save the registry."""

        record = self.registry.update_from_heartbeat(heartbeat)
        self.registry.save()
        return record

    def broadcast_version(self) -> str:
        """Resolve and publish the canonical build version."""

        version = self._version_resolver()
        self.registry.set_version(version)
        self.registry.save()
        return version

    def known_nodes(self, *, status: str | Iterable[str] | None = None) -> List[NodeRecord]:
        """Return the nodes currently registered with the mesh."""

        return self.registry.nodes(status=status)

    def agent_count(self) -> int:
        """Return the total number of registered agents."""

        return self.registry.node_count()
