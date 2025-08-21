"""Helpers for temporary attribute handling."""
from __future__ import annotations
from typing import Any, Dict

TEMP_PREFIX = "_*"

def is_temp(name: str) -> bool:
    """Return True if *name* is a temporary attribute."""
    return isinstance(name, str) and name.startswith(TEMP_PREFIX)

def strip_temp_attrs(obj: Any) -> Any:
    """Return *obj* with any temporary attributes removed.

    Supports plain dictionaries and objects with an ``attrs`` mapping
    (such as xarray Dataset/DataArray).  The function walks nested
    dictionaries recursively.
    """
    if isinstance(obj, dict):
        return {k: strip_temp_attrs(v) for k, v in obj.items() if not is_temp(k)}
    attrs = getattr(obj, "attrs", None)
    if isinstance(attrs, dict):
        keys = [k for k in attrs if is_temp(k)]
        for k in keys:
            del attrs[k]
    return obj
