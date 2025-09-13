from __future__ import annotations
from typing import Dict, Any
from .runtime import SagaDef, SagaStep


def mk_provisioning_saga(system) -> SagaDef:
    """Provisioning saga for salesforce.opportunity.closed_won."""

    def provision_infra(ctx: Dict[str, Any]):
        return system.connectors["infra"].execute("provision", account=ctx["account_name"], plan="standard")

    def deprovision(ctx: Dict[str, Any]):
        return system.connectors["infra"].execute("deprovision", account=ctx["account_name"])

    def allocate_dns(ctx: Dict[str, Any]):
        return system.connectors["domains"].execute("allocate_dns", account=ctx["account_name"])

    def release_dns(ctx: Dict[str, Any]):
        return system.connectors["domains"].execute("release_dns", account=ctx["account_name"])

    def create_runbook_repo(ctx: Dict[str, Any]):
        repo = f'{ctx["account_name"]}/runbook'
        return system.connectors["github"].execute("create_repo", name=repo, private=True)

    def archive_repo(ctx: Dict[str, Any]):
        repo = f'{ctx["account_name"]}/runbook'
        return system.connectors["github"].execute("archive_repo", name=repo)

    def create_billing(ctx: Dict[str, Any]):
        return system.connectors["infra"].execute("billing_create", account=ctx["account_name"])

    def revoke_billing(ctx: Dict[str, Any]):
        return system.connectors["infra"].execute("billing_revoke", account=ctx["account_name"])

    def notify(ctx: Dict[str, Any]):
        return system.connectors["notify"].execute("send", channel="#sales", message=f'Provisioned {ctx["account_name"]}')

    steps = [
        SagaStep("provision_infra", provision_infra, deprovision),
        SagaStep("allocate_dns", allocate_dns, release_dns),
        SagaStep("create_runbook_repo", create_runbook_repo, archive_repo),
        SagaStep("create_billing", create_billing, revoke_billing),
        SagaStep("notify", notify, None),
    ]
    return SagaDef(name="ProvisioningSaga", steps=steps)
