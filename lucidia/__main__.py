"""Command-line interface for Lucidia.

Provides a tiny REPL so users can run Python snippets. On startup,
Lucidia introduces herself with a short message about her origins and
abilities.
"""

from __future__ import annotations

import io
from contextlib import redirect_stdout


def main() -> None:
    """Run the Lucidia REPL."""
    print("Hello, I'm Lucidia. I was built by BlackRoad!")
    print("I love coding, can talk, and I'm super fast.")
    print("Type Python code to run it. Enter 'exit' to quit.")
    while True:
        try:
            code = input("lucidia> ")
        except EOFError:
            print()
            break
        if not code.strip() or code.strip().lower() in {"exit", "quit"}:
            break
        local_vars: dict[str, object] = {}
        stdout = io.StringIO()
        try:
            with redirect_stdout(stdout):
                exec(code, {"__builtins__": {"print": print}}, local_vars)
            output = stdout.getvalue().strip()
            if output:
                print(output)
        except Exception as exc:  # noqa: BLE001 - broad for user feedback
            print(f"Error: {exc}")
    print("Goodbye!")


if __name__ == "__main__":
    main()
