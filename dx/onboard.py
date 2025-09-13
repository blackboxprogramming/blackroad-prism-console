#
"""Onboarding helper ensuring environment readiness."""
import sys
from pathlib import Path

from . import ROOT, ARTIFACTS, inc_counter
from tools import storage


REPORT = ARTIFACTS / "onboard_report.md"


def doctor(root: Path = ROOT) -> bool:
    lines = ["# Onboard Doctor", "", f"python: {sys.version.split()[0]}"]
    try:
        storage.write(str(ARTIFACTS / "doctor_test.txt"), "ok")
        lines.append("write: ok")
        ok = True
    except Exception:
        lines.append("write: fail")
        ok = False
    storage.write(str(REPORT), "\n".join(lines))
    return ok


def bootstrap(root: Path = ROOT) -> None:
    venv = root / ".venv"
    venv.mkdir(exist_ok=True)
    storage.write(str(venv / "pyvenv.cfg"), "home = python")
    storage.write(str(REPORT), "bootstrap: ok")
    inc_counter("dx_onboard_bootstrap")
