import sys
import subprocess
from pathlib import Path

# Ensure package is importable
sys.path.append(str(Path(__file__).resolve().parents[0] / '..' / 'packages' / 'py-lucidgeo'))

# Build FFI library
subprocess.run([
    "cargo", "build", "--offline", "-p", "lucidia-geodesy-ffi", "--manifest-path", str(Path(__file__).resolve().parents[0] / '..' / 'packages' / 'Cargo.toml')
], check=True)

from lucidgeo import utc_to_tai

def test_utc_to_tai():
    assert utc_to_tai(0.0) == 37.0
