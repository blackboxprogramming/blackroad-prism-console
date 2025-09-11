import numpy as np

from experiments.hilbert_polya_gue import ks_distance


def test_ks_distance_two_sided():
    sample = np.array([0.1, 0.4, 0.8])

    def uniform_cdf(x):
        return x

    result = ks_distance(sample, uniform_cdf)
    assert abs(result - 4 / 15) < 1e-9
