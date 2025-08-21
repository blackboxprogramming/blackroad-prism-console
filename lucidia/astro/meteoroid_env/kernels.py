"""Physics kernels for the meteoroid environment module.

The routines here implement a small subset of orbital mechanics required for
estimating meteoroid encounter velocities and number densities.  The
implementation is self-contained and based on equations described by
Moorhead et al., *Modeling the meteoroid environment far from the ecliptic
plane / MEM 3.1-alpha*.  No code from that work is used here – only the
published mathematical relationships.

All functions operate purely on NumPy arrays and float types; no external
state is touched.  Constants are defined locally to keep the module
self-contained.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

import numpy as np
from numpy.typing import NDArray

__all__ = [
    "GM_SUN",
    "vis_viva",
    "number_density_kernel",
    "encounter_velocities_kernel",
]

# Standard gravitational parameter of the Sun [m^3/s^2].  This value is
# published by the International Astronomical Union and is widely available in
# scientific literature.
GM_SUN: float = 1.327_124_400_18e20


def vis_viva(a: float, r: float, gm: float = GM_SUN) -> float:
    """Velocity magnitude for an object in an ellipse.

    Parameters
    ----------
    a : float
        Semi-major axis [m]. Must be positive.
    r : float
        Heliocentric distance of the object [m]. Must be positive.
    gm : float, optional
        Gravitational parameter [m^3/s^2]; defaults to :data:`GM_SUN`.

    Returns
    -------
    float
        Orbital speed [m/s].
    """
    if a <= 0 or r <= 0:
        raise ValueError("Semi-major axis and radius must be positive")
    return np.sqrt(gm * (2.0 / r - 1.0 / a))


# --- Number density -------------------------------------------------------
# The model is intentionally simple: a power-law radial falloff combined with a
# vertical exponential scale height.  This mirrors the qualitative behaviour
# described by Moorhead et al. without reproducing any proprietary constants.

_N0 = 1.0e-6  # number density at 1 au in the ecliptic [1/m^3]
_R0 = 1.495_978_707e11  # 1 au in metres
_ALPHA = 1.3
_H = 0.1 * _R0  # vertical scale height


def number_density_kernel(r_vec: NDArray[np.float64]) -> float:
    """Estimate meteoroid number density at a heliocentric point.

    Parameters
    ----------
    r_vec : array-like, shape (3,)
        Cartesian heliocentric position [m].

    Returns
    -------
    float
        Number density [1/m^3].
    """
    r = np.linalg.norm(r_vec)
    if r == 0.0:
        raise ValueError("Target point cannot be at the solar centre")
    z = abs(r_vec[2])
    radial = (_R0 / r) ** _ALPHA
    vertical = np.exp(-z / _H)
    return _N0 * radial * vertical


# --- Encounter velocity geometry -----------------------------------------

def _plane_normals(r_vec: NDArray[np.float64], incl: float) -> List[NDArray[np.float64]]:
    """Return all orbital plane normals for an orbit of inclination `incl` passing
    through position `r_vec`.

    The method follows the geometric construction described by Moorhead et
    al., yielding up to two possible plane orientations.
    """
    r_hat = r_vec / np.linalg.norm(r_vec)
    k_hat = np.array([0.0, 0.0, 1.0])
    # construct basis vectors spanning the plane perpendicular to r
    if np.allclose(r_hat, k_hat) or np.allclose(r_hat, -k_hat):
        temp = np.array([1.0, 0.0, 0.0])
    else:
        temp = k_hat
    u = np.cross(temp, r_hat)
    u /= np.linalg.norm(u)
    v = np.cross(r_hat, u)

    A = u[2]
    B = v[2]
    C = np.hypot(A, B)
    cos_i = np.cos(incl)
    if C == 0:
        return []
    if abs(cos_i) > C + 1e-12:
        return []
    phi = np.arctan2(B, A)
    delta = np.arccos(np.clip(cos_i / C, -1.0, 1.0))
    normals = []
    for alpha in (phi + delta, phi - delta):
        n = u * np.cos(alpha) + v * np.sin(alpha)
        normals.append(n / np.linalg.norm(n))
    # Deduplicate normals that may be effectively the same (e.g. incl ~0)
    unique: List[NDArray[np.float64]] = []
    for n in normals:
        if not any(np.allclose(n, m) for m in unique):
            unique.append(n)
    return unique


def encounter_velocities_kernel(
    a: float, e: float, incl: float, r_vec: NDArray[np.float64]
) -> NDArray[np.float64]:
    """Compute all feasible encounter velocity vectors.

    Parameters
    ----------
    a, e, incl : float
        Orbital elements (semi-major axis [m], eccentricity, inclination [rad]).
    r_vec : array-like, shape (3,)
        Target heliocentric position [m].

    Returns
    -------
    ndarray, shape (N, 3)
        Velocity vectors [m/s], one per valid solution (up to four).
    """
    r = np.linalg.norm(r_vec)
    if not 0 <= e < 1:
        raise ValueError("Eccentricity must be in [0,1)")
    p = a * (1.0 - e**2)
    cos_f = (p / r - 1.0) / e if e > 0 else 1.0
    if abs(cos_f) > 1.0:
        return np.zeros((0, 3))
    sin_f_mag = np.sqrt(max(0.0, 1.0 - cos_f**2))
    normals = _plane_normals(r_vec, incl)
    if not normals:
        return np.zeros((0, 3))
    k = np.sqrt(GM_SUN / p)
    r_hat = r_vec / r
    velocities: List[NDArray[np.float64]] = []
    for n in normals:
        t_hat = np.cross(n, r_hat)
        t_hat /= np.linalg.norm(t_hat)
        for sin_f in (sin_f_mag, -sin_f_mag):
            v_r = k * e * sin_f
            v_t = k * (1.0 + e * cos_f)
            v = v_r * r_hat + v_t * t_hat
            velocities.append(v)
    return np.array(velocities)
