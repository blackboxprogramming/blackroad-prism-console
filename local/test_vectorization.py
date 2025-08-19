import torch

from .models import MLPPolicy, flatten_params, unflatten_params


def test_round_trip() -> None:
    model = MLPPolicy(4, 2)
    flat = flatten_params(model)
    new = torch.randn_like(flat)
    unflatten_params(model, new)
    flat2 = flatten_params(model)
    assert torch.allclose(flat2, new)
