import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_sbom_and_license():
    subprocess.check_call(["python", "build/repro/compile_deps.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/offline_wheels.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/sbom.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/licenses.py"], cwd=ROOT)
    sbom = json.loads((ROOT / "dist" / "SBOM.spdx.json").read_text())
    names = {p["name"] for p in sbom["packages"]}
    assert "blackroad_prism_console" in names
    assert "typer" in names
    lic_md = (ROOT / "dist" / "LICENSES.md").read_text()
    assert "License" in lic_md
