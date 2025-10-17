#!/usr/bin/env python3
"""Generate a simple attestation for the build."""

from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
WHEELS = DIST / "wheels"
SBOM = DIST / "SBOM.spdx.json"
ENV_SUMMARY = ROOT / "build" / "repro" / "env_summary.json"
GNUPG = ROOT / "build" / "signing" / "gnupg"


def _git_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        return "unknown"


def _fingerprint() -> str:
    out = subprocess.check_output([
        "gpg",
        "--batch",
        "--with-colons",
        "--list-secret-keys",
    ], env={"GNUPGHOME": str(GNUPG)}, text=True)
    for line in out.splitlines():
        if line.startswith("fpr:"):
            return line.split(":")[9]
    return "unknown"


def main() -> None:
    wheels = {}
    for wheel in sorted(WHEELS.glob("*.whl")):
        wheels[wheel.name] = hashlib.sha256(wheel.read_bytes()).hexdigest()
    sbom_hash = hashlib.sha256(SBOM.read_bytes()).hexdigest()
    env = json.loads(ENV_SUMMARY.read_text()) if ENV_SUMMARY.exists() else {}
    att = {
        "commit": _git_commit(),
        "environment": env,
        "wheels": wheels,
        "sbom_hash": sbom_hash,
        "built_at": datetime.utcnow().isoformat() + "Z",
        "signer": _fingerprint(),
    }
    out_file = DIST / "attestation.json"
    out_file.write_text(json.dumps(att, indent=2))
    subprocess.check_call([
        "gpg",
        "--batch",
        "--yes",
        "--detach-sign",
        "--armor",
        str(out_file),
    ], env={"GNUPGHOME": str(GNUPG)})


if __name__ == "__main__":
    main()
