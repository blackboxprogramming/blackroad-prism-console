import numpy as np

from lucidia_math_lab.sine_wave_codex import classify_wave, superposition


def test_superposition_and_classify():
    t, result = superposition([(1, 0, 1), (1, 0, 1)])
    assert t.shape == result.shape
    assert classify_wave(result[0]) in {"truth", "false", "paradox"}
