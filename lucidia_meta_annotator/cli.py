"""Command line interface for the annotator."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

from .config_schema import load_config
from .annotate import annotate_file


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="lucidia-meta")
    p.add_argument("--in", dest="in_path", required=True)
    p.add_argument("--out", dest="out_path", required=True)
    p.add_argument("--config", required=True)
    p.add_argument("--format", default="generic")
    p.add_argument("--strict", action="store_true")
    p.add_argument("--streaming", action="store_true")  # ignored but kept for compatibility
    p.add_argument("--audit")
    p.add_argument("--signature")
    args = p.parse_args(argv)

    cfg = load_config(args.config, verify_signature=bool(args.signature), signature_path=args.signature)
    annotate_file(in_path=args.in_path, out_path=args.out_path, config=cfg, format=args.format, strict=args.strict, audit_path=args.audit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
