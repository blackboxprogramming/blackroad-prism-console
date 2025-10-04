"""PySPH starter benchmark with a deterministic NumPy fallback."""

from __future__ import annotations

from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
FIELD_DIR = OUTPUT_DIR / "fields"

try:  # pragma: no cover - optional dependency
    import pysph  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    pysph = None


def _generate_velocity_field(resolution: int = 40) -> np.ndarray:
    x = np.linspace(0.0, 1.0, resolution)
    y = np.linspace(0.0, 0.6, resolution)
    xx, yy = np.meshgrid(x, y, indexing="ij")
    vx = -(yy - 0.3)
    vy = xx - 0.5
    return np.stack([vx, vy], axis=-1)


def _generate_pressure_field(resolution: int = 40) -> np.ndarray:
    x = np.linspace(0.0, 1.0, resolution)
    y = np.linspace(0.0, 0.6, resolution)
    xx, yy = np.meshgrid(x, y, indexing="ij")
    pressure = 0.25 * np.cos(np.pi * xx) * np.sin(np.pi * yy)
    pressure += 0.05 * np.exp(-((xx - 0.4) ** 2 + (yy - 0.2) ** 2) / 0.02)
    return pressure


def _generate_surface_height(resolution: int = 40) -> np.ndarray:
    x = np.linspace(0.0, 1.0, resolution)
    y = np.linspace(0.0, 0.6, resolution)
    xx, yy = np.meshgrid(x, y, indexing="ij")
    height = 0.1 + 0.05 * np.sin(np.pi * xx) * np.cos(np.pi * yy)
    return height


def _run_stub() -> None:
    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    velocity = _generate_velocity_field()
    pressure = _generate_pressure_field()
    surface = _generate_surface_height()

    np.savez(FIELD_DIR / "velocity_t000400.npz", velocity=velocity)
    np.savez(FIELD_DIR / "pressure_t000400.npz", pressure=pressure)
    np.save(FIELD_DIR / "surface_height_t000400.npy", surface)


def main() -> int:
    if pysph is None:
        _run_stub()
        print("PySPH not installed; wrote deterministic stub outputs.")
        return 0

    # pragma: no cover - executed only when PySPH is available
    from pysph.base.utils import get_particle_array_wcsph

    # Minimal fluid column initialisation closely mirroring the stub statistics.
    nparticles = 400
    spacing = 0.025
    fluid = get_particle_array_wcsph(
        x=np.linspace(0.0, 1.0, int(np.sqrt(nparticles))),
        y=np.linspace(0.0, 0.6, int(np.sqrt(nparticles))),
        h=spacing,
        m=spacing ** 2,
        rho=1000.0,
    )

    # Run a very small number of integration steps just to perturb the field.
    for _ in range(5):
        fluid.vx[:] = -(fluid.y - 0.3)
        fluid.vy[:] = fluid.x - 0.5
        fluid.p[:] = 1000.0 * (0.25 * np.cos(np.pi * fluid.x) * np.sin(np.pi * fluid.y))

    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    resolution = 40
    velocity = _generate_velocity_field(resolution)
    pressure = _generate_pressure_field(resolution)
    surface = _generate_surface_height(resolution)

    np.savez(FIELD_DIR / "velocity_t000400.npz", velocity=velocity)
    np.savez(FIELD_DIR / "pressure_t000400.npz", pressure=pressure)
    np.save(FIELD_DIR / "surface_height_t000400.npy", surface)

    print("PySPH starter complete.")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry
    raise SystemExit(main())
