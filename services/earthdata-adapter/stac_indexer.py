"""Minimal STAC indexer worker.

This placeholder illustrates how AppEEARS outputs or self-hosted products could
be converted into STAC items with COG assets.
"""
from typing import Any, Dict


def index_stac_item(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a minimal STAC item from provided metadata.

    Parameters
    ----------
    data: Dict[str, Any]
        Input dictionary containing at least an ``id`` and optional ``assets``.

    Returns
    -------
    Dict[str, Any]
        A STAC item representation.
    """
    return {
        "id": data.get("id", "unknown"),
        "type": "Feature",
        "assets": data.get("assets", []),
    }
