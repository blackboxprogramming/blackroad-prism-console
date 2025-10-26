from __future__ import annotations

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_PASSWORD_HASHER = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)


def hash_password(password: str) -> str:
    return _PASSWORD_HASHER.hash(password)


def verify_password(hash_: str, password: str) -> bool:
    try:
        return _PASSWORD_HASHER.verify(hash_, password)
    except VerifyMismatchError:
        return False
