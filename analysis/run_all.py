"""Execute analysis notebooks to regenerate figures."""
from __future__ import annotations

import subprocess
from pathlib import Path

NOTEBOOKS = [
    "tap_null_isi.ipynb",
    "selectors_autocorr.ipynb",
    "variance_surfaces.ipynb",
    "nphase_weierstrass.ipynb",
]


def run_notebook(nb: str) -> None:
    """Execute a single notebook in place."""
    subprocess.run(
        [
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--inplace",
            nb,
        ],
        check=True,
    )


def main() -> None:
    base = Path(__file__).parent
    for nb in NOTEBOOKS:
        run_notebook(str(base / nb))


if __name__ == "__main__":
    main()
