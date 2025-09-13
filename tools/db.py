"""Stub database adapter.

All actions must be logged and no real database operations are executed.
"""


def query(sql: str):
    """Execute *sql* query.

    Raises
    ------
    NotImplementedError
        Always, as database access is disabled.
    """

    raise NotImplementedError("Database access disabled by guardrails")
