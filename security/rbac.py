from __future__ import annotations

from dataclasses import dataclass
from functools import wraps
from typing import Callable, Iterable, Optional

from tools import storage
from orchestrator import audit

# Permission constants
TASK_CREATE = "TASK_CREATE"
TASK_ROUTE = "TASK_ROUTE"
TASK_VIEW = "TASK_VIEW"
TASK_EXPORT = "TASK_EXPORT"
PROGRAM_EDIT = "PROGRAM_EDIT"
SCHEDULE_RUN = "SCHEDULE_RUN"
APPROVAL_REQUEST = "APPROVAL_REQUEST"
APPROVAL_DECIDE = "APPROVAL_DECIDE"
ADMIN = "ADMIN"


@dataclass
class Role:
    name: str
    permissions: set[str]


@dataclass
class User:
    id: str
    name: str
    roles: list[str]


class RBAC:
    def __init__(self) -> None:
        data = storage.read_json("users.json")
        self.roles = {r: set(perms) for r, perms in data["roles"].items()}
        self.users = {u["id"]: User(**u) for u in data["users"]}

    def get_user(self, user_id: str) -> User:
        return self.users[user_id]

    def permissions_for(self, user: User) -> set[str]:
        perms: set[str] = set()
        for r in user.roles:
            perms.update(self.roles.get(r, set()))
        return perms

    def check(self, user: User, required: Iterable[str]) -> bool:
        perms = self.permissions_for(user)
        if ADMIN in perms:
            return True
        return all(p in perms for p in required)


rbac = RBAC()


class PermissionError(RuntimeError):
    pass


def require(perms: Iterable[str]) -> Callable[[Callable[..., object]], Callable[..., object]]:
    def decorator(func: Callable[..., object]) -> Callable[..., object]:
        @wraps(func)
        def wrapper(*args, **kwargs):
            user: Optional[User] = kwargs.get("user")
            if user is None:
                raise RuntimeError("user not provided")
            if not rbac.check(user, perms):
                audit.log_event(func.__name__, ok=False, user=user)
                raise PermissionError("permission_denied")
            result = func(*args, **kwargs)
            audit.log_event(func.__name__, ok=True, user=user)
            return result

        return wrapper

    return decorator
