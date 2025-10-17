import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd, cwd=ROOT)


def test_wheel_sign_verify(tmp_path):
    run(["python", "build/repro/compile_deps.py"])
    run(["python", "build/offline_wheels.py"])
    run(["bash", "build/signing/keygen.sh"])
    run(["python", "build/signing/sign_wheels.py"])
    run(["python", "build/signing/verify_wheels.py"])
    sha = ROOT / "dist" / "wheels" / "SHA256SUMS"
    assert sha.exists()
    data = sha.read_text().strip()
    assert "blackroad_prism_console" in data
    env = json.loads((ROOT / "build" / "repro" / "env_summary.json").read_text())
    assert "python" in env
