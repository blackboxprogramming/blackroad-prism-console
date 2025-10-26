"""Codex-28 Auditor agent package."""

from importlib import resources

def get_guardpack_path(name: str) -> str:
    """Return the filesystem path for a guardpack by ``name``.

    Parameters
    ----------
    name:
        File name of the guardpack within the ``guardpacks`` directory.

    Returns
    -------
    str
        Absolute path pointing to the requested guardpack resource.
    """

    return str(resources.files(__package__) / "guardpacks" / name)


__all__ = ["get_guardpack_path"]
