"""Command line entry point for the universal simulation starter bundle."""

from __future__ import annotations

from universal_sim import run_pipeline


def main() -> None:
    files = run_pipeline()
    print("Generated artefacts:")
    for label, location in files.items():
        print(f"- {label}: {location}")


if __name__ == "__main__":
    main()
