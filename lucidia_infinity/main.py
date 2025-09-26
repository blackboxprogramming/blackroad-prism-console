"""Entry point for Lucidia Infinity Math System."""

from __future__ import annotations

from .ui import repl


def main() -> None:
    """Launch the command line REPL."""

    repl()


if __name__ == "__main__":  # pragma: no cover - manual invocation
    main()
