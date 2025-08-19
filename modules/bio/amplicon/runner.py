#!/usr/bin/env python3
"""Wrapper to launch the GeneLab Amplicon workflow via Nextflow."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WF_DIR = ROOT / "third_party" / "nasa_amplicon" / "NF_AmpIllumina_1.0.0"


def run(runsheet: str, target_region: str, f_primer: str, r_primer: str) -> int:
    cmd = [
        "nextflow",
        "run",
        str(WF_DIR / "main.nf"),
        "--input_file",
        runsheet,
        "--target_region",
        target_region,
        "--F_primer",
        f_primer,
        "--R_primer",
        r_primer,
        "-profile",
        "docker",
    ]
    return subprocess.call(cmd)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.stderr.write("Usage: runner.py <runsheet.csv> <target_region> <F_primer> <R_primer>\n")
        raise SystemExit(1)
    sys.exit(run(*sys.argv[1:]))
