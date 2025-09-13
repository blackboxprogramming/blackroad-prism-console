import pytest
from orchestrator import approvals, tasks
from orchestrator.exceptions import BotExecutionError
from security import rbac


def test_create_decide_and_route():
    pm = rbac.rbac.get_user("U_PM")
    cfo = rbac.rbac.get_user("U_CFO")
    task = tasks.create_task("Draft hedging plan", {"intent": "hedging_plan"}, user=pm)
    with pytest.raises(BotExecutionError):
        tasks.route_task(task.id, "Treasury-BOT", user=pm)
    req = approvals.create_approval(task.id, pm.id, "CFO")
    approvals.decide(req.id, "approved", cfo.id, "ok")
    routed = tasks.route_task(task.id, "Treasury-BOT", user=pm)
    assert routed.status == "routed"
