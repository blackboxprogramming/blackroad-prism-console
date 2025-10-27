from __future__ import annotations

from datetime import datetime, timedelta, timezone

from orchestrator.network_mesh import MeshRegistry, NodeHeartbeat, RootAgent


def test_mesh_registry_round_trip(tmp_path):
    registry_path = tmp_path / "registry.json"
    registry = MeshRegistry.load(registry_path, network="blackroad-mesh")
    assert registry.node_count() == 0

    heartbeat = NodeHeartbeat(
        id="alice-pi400",
        role="root",
        status="active",
        version="abc123",
        supervisor=None,
    )
    registry.update_from_heartbeat(heartbeat)
    registry.save()

    reloaded = MeshRegistry.load(registry_path)
    assert reloaded.node_count() == 1
    record = reloaded.get("alice-pi400")
    assert record is not None
    assert record.status == "active"
    assert record.version == "abc123"
    assert record.role == "root"


def test_root_agent_tracks_versions(tmp_path):
    registry_path = tmp_path / "registry.json"
    registry = MeshRegistry.load(registry_path)

    version_values = ["v1", "v2"]

    def _resolver() -> str:
        return version_values.pop(0)

    agent = RootAgent(registry, version_resolver=_resolver)
    first = agent.broadcast_version()
    assert first == "v1"
    assert registry.version == "v1"

    agent.register_heartbeat(
        NodeHeartbeat(
            id="lucidia-pi5",
            role="display_node",
            status="active",
            supervisor="alice-pi400",
            version="v1",
        )
    )

    later = datetime.now(timezone.utc) + timedelta(seconds=5)
    agent.register_heartbeat(
        NodeHeartbeat(
            id="lucidia-pi5",
            role="display_node",
            status="idle",
            supervisor="alice-pi400",
            version="v2",
            timestamp=later,
        )
    )

    records = agent.known_nodes()
    assert len(records) == 1
    assert records[0].status == "idle"
    assert records[0].version == "v2"

    second = agent.broadcast_version()
    assert second == "v2"
    assert registry.version == "v2"
