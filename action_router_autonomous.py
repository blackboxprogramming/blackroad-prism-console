from typing import Dict, Any
from event_mesh import EventEnvelope
from org_graph import OrgGraph, apply_salesforce, apply_github
from policy_kernel import PolicyKernel
from saga_runtime import SagaRuntime
from provisioning_saga import mk_provisioning_saga


class AutonomousActionRouter:
    def __init__(self, system, graph: OrgGraph, policies: PolicyKernel, saga: SagaRuntime):
        self.system = system
        self.graph = graph
        self.policies = policies
        self.sagas = saga
        self.sagas.register(mk_provisioning_saga(system))

    def handle(self, evt: EventEnvelope) -> Dict[str, Any]:
        decision = self.policies.evaluate({
            "source": evt.source,
            "type": evt.type,
            "payload": evt.payload,
            "headers": evt.headers,
        })
        if decision["decision"] == "DENY":
            self.system.connectors["notify"].execute(
                "send", channel="#ops",
                message=f'⛔ Denied {evt.type} risk={decision["risk"]}: {decision["reason"]}'
            )
            return {"ok": False, "decision": decision}

        if evt.source == "salesforce":
            apply_salesforce(evt, self.graph)
        if evt.source == "github":
            apply_github(evt, self.graph)

        event_id = evt.type.split(".", 1)[-1]

        if evt.source == "salesforce" and evt.type.endswith("opportunity.closed_won"):
            acc = evt.payload["account"]["name"]
            if decision["decision"] == "REVIEW":
                self.system.connectors["notify"].execute(
                    "send", channel="#sales",
                    message=f'⚠️ REVIEW {evt.type} {acc} risk={decision["risk"]}: {decision["reason"]}'
                )
                return {"ok": True, "routed": "review"}
            sid = self.sagas.start("ProvisioningSaga", {"account_name": acc})
            return {"ok": True, "routed": "saga_provision", "saga_id": sid}

        if evt.source == "github" and event_id in ("push", "pr.merged"):
            repo = evt.payload.get("repository", {}).get("full_name", "repo/unknown")
            if decision["decision"] == "REVIEW":
                self.system.connectors["notify"].execute(
                    "send", channel="#deploys", message=f'⚠️ REVIEW deploy {repo} risk={decision["risk"]}'
                )
                return {"ok": True, "routed": "review"}
            self.system.connectors["infra"].execute("deploy_service", service=repo, env="staging")
            self.system.connectors["notify"].execute(
                "send", channel="#deploys", message=f"🚀 Deployed {repo} to staging"
            )
            return {"ok": True, "routed": "github.change.cicd"}

        if evt.source == "github" and event_id == "branch.deleted":
            repo = evt.payload.get("repository", {}).get("full_name", "repo/unknown")
            branch = evt.payload.get("branch") or evt.payload.get("ref")
            actor = (
                evt.payload.get("actor")
                or (evt.payload.get("sender") or {}).get("login")
                or "unknown"
            )
            if decision["decision"] == "REVIEW":
                self.system.connectors["notify"].execute(
                    "send",
                    channel="#ops",
                    message=f'⚠️ REVIEW branch delete {branch or "unknown"} in {repo} risk={decision["risk"]}',
                )
                return {"ok": True, "routed": "review"}
            record = self.system.record_branch_deletion(
                repo=repo,
                branch=branch,
                actor=actor,
                ref=evt.payload.get("ref"),
                ref_type=evt.payload.get("ref_type"),
                deleted_at=evt.payload.get("deleted_at"),
            )
            self.system.notify(
                channel="#ops",
                message=f"🧹 Deleted branch {record['branch'] or 'unknown'} from {repo} (by {actor})",
            )
            return {"ok": True, "routed": "github.branch.deleted", "record": record}

        return {"ok": True, "routed": "no-op"}
