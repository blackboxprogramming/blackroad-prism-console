from __future__ import annotations

import torch

from alice_lucidia.models.hopfield import HopfieldConfig, ModernHopfieldHead


def test_hopfield_energy_monotonicity() -> None:
    config = HopfieldConfig(beta=10.0, projection_dim=8)
    head = ModernHopfieldHead(config, input_dim=8)
    query = torch.randn(1, 8)
    candidates = torch.randn(1, 3, 8)
    candidates[:, 0] = query
    _, energy = head(query, candidates)
    assert torch.isfinite(energy).all()
    # Best match should give lower energy compared to random replacement
    candidates_shuffled = candidates.clone()
    candidates_shuffled[:, 0] = torch.randn(1, 8)
    _, energy_shuffled = head(query, candidates_shuffled)
    assert energy.mean() < energy_shuffled.mean()


def test_gated_write_limits() -> None:
    config = HopfieldConfig(beta=5.0, projection_dim=4)
    head = ModernHopfieldHead(config, input_dim=4)
    memory = torch.zeros(2, 4)
    new_value = torch.ones(2, 4)
    gate = torch.tensor([[1.0], [0.0]])
    updated = head.gated_write(memory, new_value, gate)
    assert torch.all(updated[0] == new_value[0])
    assert torch.all(updated[1] >= memory[1])
