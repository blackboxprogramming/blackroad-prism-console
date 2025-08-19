"""Placeholder NetCDF adapter."""
from __future__ import annotations

# Actual NetCDF handling intentionally omitted in this reference
# implementation.  The module exists to document the extension point.

def read_dataset(path: str):  # pragma: no cover - placeholder
    raise NotImplementedError("netcdf support not included")


def write_dataset(ds, path: str):  # pragma: no cover - placeholder
    raise NotImplementedError("netcdf support not included")
