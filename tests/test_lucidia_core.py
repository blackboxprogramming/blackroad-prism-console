"""Tests for Lucidia core utilities."""

from lucidia.core import Vector3


def test_vector_addition_and_subtraction():
    a = Vector3(1, 2, 3)
    b = Vector3(4, 5, 6)
    assert a + b == Vector3(5, 7, 9)
    assert b - a == Vector3(3, 3, 3)


def test_vector_dot_and_norm():
    v = Vector3(3, 4, 12)
    assert v.dot(Vector3(1, 0, 0)) == 3
    assert v.norm() == 13


def test_vector_scalar_multiplication():
    v = Vector3(1, -2, 0.5)
    scaled = 2 * v
    assert scaled == Vector3(2, -4, 1)
    assert scaled.as_tuple() == (2, -4, 1)
