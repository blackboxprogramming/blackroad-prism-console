"""Python bindings for lucidia-geodesy via ctypes."""

import ctypes
import os
from pathlib import Path

_lib = None

def _load_lib():
    global _lib
    if _lib is None:
        libname = "liblucidgeo_ffi.so"
        libpath = (
            Path(__file__).resolve().parent.parent.parent
            / "target" / "debug" / libname
        )
        _lib = ctypes.CDLL(str(libpath))
    return _lib


def utc_to_tai(utc: float) -> float:
    lib = _load_lib()
    lib.lucidgeo_utc_to_tai.restype = ctypes.c_double
    lib.lucidgeo_utc_to_tai.argtypes = [ctypes.c_double]
    return float(lib.lucidgeo_utc_to_tai(ctypes.c_double(utc)))


def itrs_to_gcrs(vec):
    lib = _load_lib()
    lib.lucidgeo_itrs_to_gcrs.argtypes = [
        ctypes.c_double,
        ctypes.c_double,
        ctypes.c_double,
        ctypes.POINTER(ctypes.c_double * 3),
    ]
    out = (ctypes.c_double * 3)()
    lib.lucidgeo_itrs_to_gcrs(vec[0], vec[1], vec[2], ctypes.byref(out))
    return [out[0], out[1], out[2]]
