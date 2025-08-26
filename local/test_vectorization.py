# mypy: ignore-errors
"""Tests for parameter vector utilities."""

from __future__ import annotations

import pytest

torch = pytest.importorskip("torch", reason="Install torch or ask codex for help")

from .models import MLPPolicy, params_to_vector, vector_to_params, flatten_params, unflatten_params


def test_vector_round_trip() -> None:
    policy = MLPPolicy(4, 2)
    vec = params_to_vector(policy)
    perturbed = vec + torch.randn_like(vec)
    vector_to_params(perturbed, policy)
    new_vec = params_to_vector(policy)
    assert torch.allclose(perturbed, new_vec)


def test_round_trip() -> None:
    model = MLPPolicy(4, 2)
    flat = flatten_params(model)
    new = torch.randn_like(flat)
    unflatten_params(model, new)
    flat2 = flatten_params(model)
    assert torch.allclose(flat2, new)
