"""Agent that builds the BlackRoad.io website using npm."""
from __future__ import annotations

import subprocess
from pathlib import Path


def build_site() -> int:
    """Run the npm build for the BlackRoad.io site.

    Returns the exit code from the npm process. If npm is unavailable or the
    build fails, a non-zero code is returned and a message is printed.
    """
    site_dir = Path(__file__).resolve().parent.parent / "sites" / "blackroad"
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=site_dir,
            check=True,
        )
        return result.returncode
    except FileNotFoundError:
        print("npm is not installed or not on PATH.")
        return 1
    except subprocess.CalledProcessError as exc:
        print("Site build failed:", exc)
        return exc.returncode


if __name__ == "__main__":
    raise SystemExit(build_site())
