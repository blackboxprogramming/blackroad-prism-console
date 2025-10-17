import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_offline_install_uninstall():
    subprocess.check_call(["python", "build/repro/compile_deps.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/offline_wheels.py"], cwd=ROOT)
    subprocess.check_call(["bash", "build/signing/keygen.sh"], cwd=ROOT)
    subprocess.check_call(["python", "build/signing/sign_wheels.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/signing/verify_wheels.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/sbom.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/licenses.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/attest.py"], cwd=ROOT)
    subprocess.check_call(["bash", "install/offline_install.sh"], cwd=ROOT)
    assert (ROOT / ".venv").exists()
    subprocess.check_call(["bash", "install/offline_uninstall.sh"], cwd=ROOT)
    assert not (ROOT / ".venv").exists()
