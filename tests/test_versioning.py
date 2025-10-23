import re
import subprocess
import sys
from pathlib import Path


def test_semver_valid():
    from version import __version__
    assert re.match(r"^\d+\.\d+\.\d+$", __version__)


def test_version_bump(tmp_path):
    root = tmp_path
    (root / "version.py").write_text('__version__ = "0.1.0"\n')
    (root / "CHANGELOG.md").write_text("# Changelog\n")
    subprocess.run([
        sys.executable,
        "-m",
        "cli.console",
        "version:bump",
        "--part",
        "patch",
        "--path",
        str(root),
    ], check=True)
    assert '__version__ = "0.1.1"' in (root / "version.py").read_text()
    assert "[0.1.1]" in (root / "CHANGELOG.md").read_text()
