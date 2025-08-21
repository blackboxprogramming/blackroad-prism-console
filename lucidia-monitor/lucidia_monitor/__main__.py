import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Lucidia monitor CLI (placeholder)")
    sub = parser.add_subparsers(dest="command")
    for cmd in ("qualify", "probe", "load", "report"):
        sub.add_parser(cmd)
    args = parser.parse_args()
    print(f"subcommand {args.command!r} not implemented")


if __name__ == "__main__":
    main()
