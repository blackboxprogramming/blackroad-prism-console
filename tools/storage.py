"""Stub storage adapter.

Provides a placeholder interface for persistent storage.
"""


def save(key: str, data: str) -> None:
    """Persist *data* under *key*.

    Raises
    ------
    NotImplementedError
        Always, since storage is not configured.
    """

    raise NotImplementedError("Persistent storage not configured")
