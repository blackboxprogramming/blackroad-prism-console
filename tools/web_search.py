"""Stub web search adapter.

No network calls are permitted; this module is a placeholder.
"""


def search(query: str) -> list[str]:
    """Return results for *query*.

    Raises
    ------
    NotImplementedError
        Always, because network access is disabled.
    """

    raise NotImplementedError("Network access disabled by guardrails")
