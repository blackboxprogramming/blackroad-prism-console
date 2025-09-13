import pytest
from security import rbac


def test_permission_allow():
    user = rbac.rbac.get_user("U_PM")
    @rbac.require([rbac.TASK_CREATE])
    def create(*, user):
        return True
    assert create(user=user)


def test_permission_deny():
    user = rbac.rbac.get_user("U_PM")
    @rbac.require([rbac.TASK_EXPORT])
    def export(*, user):
        return True
    with pytest.raises(rbac.PermissionError):
        export(user=user)
