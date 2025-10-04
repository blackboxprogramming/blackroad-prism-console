"""Convenience wrapper to execute the full universal simulation starter pipeline."""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


DEFAULT_ROOT = Path(__file__).resolve().parents[1]


def run_command(command: list[str]) -> None:
    print(f"$ {' '.join(command)}")
    subprocess.run(command, check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run generation, comparison, and reporting stages")
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--force-stub", action="store_true", help="Force stub metrics by forwarding flag to run_variants")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = args.root
    variants = root / "10_genesis" / "variants.yaml"
    outputs = root / "outputs"

    run_variants_cmd = [
        "python3",
        str(root / "10_genesis" / "run_variants.py"),
        "--variants-file",
        str(variants),
        "--output-dir",
        str(outputs),
    ]
    if args.force_stub:
        run_variants_cmd.append("--force-stub")
    run_command(run_variants_cmd)

    run_command([
        "python3",
        str(root / "40_compare" / "batch_compare.py"),
        "--outputs-dir",
        str(outputs),
        "--variants-file",
        str(variants),
    ])

    run_command([
        "python3",
        str(root / "90_reports" / "make_report.py"),
        "--outputs-dir",
        str(outputs),
        "--variants-file",
        str(variants),
    ])

    run_command([
        "python3",
        str(root / "tools" / "check_pipeline.py"),
        "--variants-file",
        str(variants),
        "--outputs-dir",
        str(outputs),
    ])


if __name__ == "__main__":
    main()
