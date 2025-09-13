import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GNUPGHOME = ROOT / "build" / "signing" / "gnupg"


def test_attestation_signatures():
    subprocess.check_call(["python", "build/repro/compile_deps.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/offline_wheels.py"], cwd=ROOT)
    subprocess.check_call(["bash", "build/signing/keygen.sh"], cwd=ROOT)
    subprocess.check_call(["python", "build/signing/sign_wheels.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/sbom.py"], cwd=ROOT)
    subprocess.check_call(["python", "build/attest.py"], cwd=ROOT)
    att = json.loads((ROOT / "dist" / "attestation.json").read_text())
    wheel = next((ROOT / "dist" / "wheels").glob("blackroad_prism_console-*.whl"))
    digest = hashlib.sha256(wheel.read_bytes()).hexdigest()
    assert att["wheels"][wheel.name] == digest
    subprocess.check_call([
        "gpg",
        "--batch",
        "--verify",
        str(ROOT / "dist" / "attestation.json.asc"),
        str(ROOT / "dist" / "attestation.json"),
    ], env={"GNUPGHOME": str(GNUPGHOME)})
