from __future__ import annotations

import torch
from torch import nn

from alice_lucidia.models.natural_grad import NaturalGradientConfig, NaturalGradientOptimizer


def test_natural_gradient_updates() -> None:
    model = nn.Linear(4, 2)
    opt = NaturalGradientOptimizer(model.parameters(), NaturalGradientConfig(base_lr=1e-2))
    data = torch.randn(8, 4)
    target = torch.randn(8, 2)
    criterion = nn.MSELoss()

    out = model(data)
    loss = criterion(out, target)
    loss.backward()
    opt.step()
    for param in model.parameters():
        state = opt.state[param]
        assert "fisher" in state
        assert state["fisher"].shape == param.grad.shape
