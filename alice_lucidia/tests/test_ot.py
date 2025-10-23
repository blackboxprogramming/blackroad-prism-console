from __future__ import annotations

import torch

from alice_lucidia.models.ot import BridgeConfig, schrodinger_bridge, sinkhorn_transport


def test_sinkhorn_transport_properties() -> None:
    p = torch.tensor([0.5, 0.5])
    q = torch.tensor([0.5, 0.5])
    cost = torch.tensor([[0.0, 1.0], [1.0, 0.0]])
    plan, (u, v) = sinkhorn_transport(p, q, cost, epsilon=0.1, max_iters=50)
    assert plan.shape == cost.shape
    assert torch.isclose(plan.sum(), torch.tensor(1.0), atol=1e-4)
    assert torch.all(torch.isfinite(u)) and torch.all(torch.isfinite(v))


def test_schrodinger_bridge_monotonic_path() -> None:
    prior = torch.zeros(2, 4)
    target = torch.ones(2, 4)
    path = schrodinger_bridge(prior, target, BridgeConfig(steps=4, epsilon=0.0, alpha=0.5))
    assert path.shape[0] == 6  # steps + endpoints
    assert torch.all(path[0] == prior)
    assert torch.all(path[-1] == target)
