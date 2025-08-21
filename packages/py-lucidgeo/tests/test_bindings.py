import subprocess
import sys
from pathlib import Path

# Ensure package path is on sys.path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Build the ffi library before loading
subprocess.run([
    "cargo", "build", "--offline", "-p", "lucidia-geodesy-ffi", "--manifest-path", str(Path(__file__).resolve().parents[2] / "Cargo.toml")
], check=True)

from lucidgeo import utc_to_tai, itrs_to_gcrs

def test_ffi_bindings():
    assert utc_to_tai(0.0) == 37.0
    assert itrs_to_gcrs([1.0,2.0,3.0]) == [1.0,2.0,3.0]
