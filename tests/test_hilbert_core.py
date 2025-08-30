import numpy as np
import pytest

from hilbert_core import mixed_state


def test_mixed_state_probability_validation():
    e0 = np.array([1, 0], dtype=np.complex128)
    e1 = np.array([0, 1], dtype=np.complex128)

    # mismatched probability length
    with pytest.raises(ValueError):
        mixed_state([e0, e1], probs=[1.0])

    # negative probability
    with pytest.raises(ValueError):
        mixed_state([e0, e1], probs=[0.5, -0.5])

    # valid case normalizes probabilities
    rho = mixed_state([e0, e1], probs=[0.25, 0.75])
    assert np.allclose(np.trace(rho), 1.0)
