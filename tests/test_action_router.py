from action_router_autonomous import AutonomousActionRouter
from event_mesh import EventEnvelope
from lucidia_core import UnifiedPortalSystem
from org_graph import OrgGraph
from policy_kernel import PolicyKernel
from saga_runtime import SagaRuntime


def test_branch_deletion_routed_and_persisted(tmp_path):
    system = UnifiedPortalSystem(memory_snapshot_path=str(tmp_path / "memory.json"))
    graph = OrgGraph(str(tmp_path / "graph.json"))
    policies = PolicyKernel()
    saga = SagaRuntime(str(tmp_path / "sagas.json"))
    router = AutonomousActionRouter(system, graph, policies, saga)

    evt = EventEnvelope(
        source="github",
        type="github.branch.deleted",
        payload={
            "repository": {"full_name": "blackroad/prism-console", "default_branch": "main"},
            "branch": "feature/cleanup",
            "ref": "refs/heads/feature/cleanup",
            "ref_type": "branch",
            "actor": "octocat",
            "sender": {"login": "octocat"},
            "event": "delete",
        },
        headers={},
    )

    result = router.handle(evt)

    assert result["ok"] is True
    assert result["routed"] == "github.branch.deleted"
    history = system.memory.retrieve("deleted_branches", [])
    assert history[-1]["branch"] == "feature/cleanup"
    assert history[-1]["repo"] == "blackroad/prism-console"
    assert history[-1]["actor"] == "octocat"
    assert graph.edges[-1]["rel"] == "DELETED_BRANCH"
    assert graph.edges[-1]["dst"] == "feature/cleanup"
