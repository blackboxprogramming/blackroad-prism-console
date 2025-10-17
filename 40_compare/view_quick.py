"""Quick inspection utility for volume datasets."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import numpy as np

DEFAULT_VOLUME = Path("10_genesis/outputs/t000400/fluid_volume.npz")


def _load_npz(path: Path) -> Iterable[tuple[str, np.ndarray]]:
    with np.load(path) as data:  # type: ignore[call-arg]
        for name in data.files:
            yield name, data[name]


def _describe_field(name: str, array: np.ndarray) -> None:
    print(f"Field: {name}")
    print(f"  dtype: {array.dtype}")
    print(f"  shape: {array.shape}")
    print(
        "  stats: min={:.6f} max={:.6f} mean={:.6f} std={:.6f}".format(
            float(np.min(array)),
            float(np.max(array)),
            float(np.mean(array)),
            float(np.std(array)),
        )
    )

    if array.ndim < 3:
        print("  mid-slice: n/a (array has fewer than 3 dimensions)")
        return

    mid_index = array.shape[0] // 2
    slice_view = array[mid_index]
    if slice_view.ndim == 2:
        printable = slice_view
    else:
        printable = np.linalg.norm(slice_view, axis=-1)
    np.set_printoptions(precision=3, suppress=True, linewidth=120)
    print("  mid-slice magnitude:")
    print(printable)
    print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "volume",
        nargs="?",
        default=DEFAULT_VOLUME,
        type=Path,
        help="Path to the npz volume file to inspect.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    path = args.volume
    if not path.exists():
        raise SystemExit(f"Volume file not found: {path}")
    print(f"Inspecting {path}")
    for name, array in _load_npz(path):
        _describe_field(name, array)


if __name__ == "__main__":
    main()
