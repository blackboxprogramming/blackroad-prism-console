"""CLI interface for lucidia_reason."""
from __future__ import annotations

import argparse
from pathlib import Path
from .pot import plan_question


def main() -> None:
    parser = argparse.ArgumentParser(prog="lucidia-reason")
    sub = parser.add_subparsers(dest="cmd")

    plan_p = sub.add_parser("plan", help="plan a question")
    plan_p.add_argument("question")
    plan_p.add_argument("--n", type=int, default=1)
    plan_p.add_argument("--out", type=str, default=None)

    args = parser.parse_args()

    if args.cmd == "plan":
        plan_question(args.question, n=args.n, out_dir=args.out)
    else:
        parser.print_help()


if __name__ == "__main__":  # pragma: no cover
    main()
