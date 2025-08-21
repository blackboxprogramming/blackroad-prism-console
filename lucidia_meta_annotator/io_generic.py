"""Generic metadata adapter."""
from __future__ import annotations
from typing import Dict, Any
from .tempattr import strip_temp_attrs


def read_metadata(data: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of *data* suitable for annotation."""
    return dict(data)


def write_metadata(data: Dict[str, Any], strip_temp: bool = True) -> Dict[str, Any]:
    """Return sanitized metadata ready for persistence."""
    if strip_temp:
        data = strip_temp_attrs(data)
    return data
