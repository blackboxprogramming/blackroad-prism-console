def query(sql: str, db: str) -> list[dict]:
    """Return mock rows for a query."""
    return [{"sql": sql, "db": db, "result": 1}]
"""Stub database adapter."""


def query(sql: str) -> str:
    """Stubbed DB query."""
    raise NotImplementedError(
        "DB access not implemented. TODO: connect to database with read-only credentials"
    )
