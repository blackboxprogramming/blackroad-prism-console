import json
import time
from lucidia_core import UnifiedPortalSystem
from event_mesh import InMemoryEventBus, github_webhook_to_event, salesforce_webhook_to_event
from org_graph import OrgGraph
from policy_kernel import PolicyKernel
from saga_runtime import SagaRuntime
from action_router_autonomous import AutonomousActionRouter

if __name__ == "__main__":
    system = UnifiedPortalSystem(memory_snapshot_path="./lucidia_mem.json")
    bus = InMemoryEventBus()
    graph = OrgGraph("./org_graph.json")
    policies = PolicyKernel()
    saga = SagaRuntime("./sagas.json")
    router = AutonomousActionRouter(system, graph, policies, saga)
    bus.subscribe(lambda e: router.handle(e))

    sf_payload = json.dumps({
        "type": "opportunity.closed_won",
        "user": "ae@company.com",
        "account": {"id": "acc-001", "name": "Acme Corp"},
        "opportunity": {"id": "opp-123", "stage": "Closed Won", "amount": 120000}
    })
    bus.publish(salesforce_webhook_to_event(sf_payload))

    time.sleep(0.1)
    for sid, st in list(saga.state.items()):
        while st["status"] not in ("COMPLETED", "FAILED"):
            st = saga.tick(sid)

    gh_payload = json.dumps({
        "event": "push",
        "delivery": "abc123",
        "sender": {"login": "devx"},
        "repository": {"full_name": "platform/api-gateway", "default_branch": "main"}
    })
    bus.publish(github_webhook_to_event(gh_payload))

    print(json.dumps(system.status_report(), indent=2))
    print("--- Graph OWNS neighbors:", graph.neighbors("acc-001", "OWNS"))
    print("--- Saga states:", json.dumps(saga.state, indent=2))
