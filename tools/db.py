def query(sql: str, db: str) -> list[dict]:
    """Return mock rows for a query."""
    return [{"sql": sql, "db": db, "result": 1}]
