import pytest

np = pytest.importorskip("numpy", reason="Install numpy or ask codex for help")
from numpy.testing import assert_allclose

from lucidia.astro.meteoroid_env import (
    OrbitalElements,
    TargetPoint,
    encounter_velocities,
    number_density,
)
from lucidia.astro.meteoroid_env.kernels import GM_SUN, vis_viva
from lucidia.astro.meteoroid_env.units import AU


def test_number_density_radial_and_vertical_scaling():
    elements = OrbitalElements(a=AU, e=0.1, i=0.1)
    p0 = TargetPoint(AU, 0.0, 0.0)
    p1 = TargetPoint(2 * AU, 0.0, 0.0)
    p2 = TargetPoint(AU, 0.0, 0.1 * AU)

    n0 = number_density(elements, p0)
    n1 = number_density(elements, p1)
    n2 = number_density(elements, p2)

    assert_allclose(n1, n0 / 2 ** 1.3, rtol=1e-6)
    assert_allclose(n2, n0 * np.exp(-1.0), rtol=1e-6)


def test_encounter_velocities_geometry():
    elements = OrbitalElements(a=AU, e=0.1, i=0.3)
    point = TargetPoint(AU, 0.0, 0.0)
    vels = encounter_velocities(elements, point)

    assert vels.shape[1] == 3
    assert 1 <= vels.shape[0] <= 4

    r_vec = np.array([point.x, point.y, point.z])
    r = np.linalg.norm(r_vec)
    speed = vis_viva(elements.a, r)
    for v in vels:
        assert_allclose(np.linalg.norm(v), speed, rtol=1e-6)
        h = np.cross(r_vec, v)
        n_hat = h / np.linalg.norm(h)
        assert_allclose(abs(n_hat[2]), np.cos(elements.i), atol=1e-6)
