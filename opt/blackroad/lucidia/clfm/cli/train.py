"""Training entry point for c-LFM demos.

The train function performs two stages:
1. Fit the functional VAE on dataset samples.
2. Train a latent flow model using the VAE latents.

This implementation is intentionally lightweight and aimed at CPU
execution for small demo problems.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import torch
from torch.utils.data import DataLoader

from ..core.deeponet import BranchNetConfig, TrunkNetConfig
from ..core.vae import EncoderConfig, FunctionalVAE, VAEConfig
from ..core.flow import FlowConfig, LatentFlow, train_flow
from ..data.datasets import GaussianProcessDataset, GPDatasetConfig
from ..core.grid import Grid1D


DEFAULT_OUT = Path("opt/blackroad/lucidia/artifacts")


def train(cfg: Optional[dict] = None) -> dict:
    cfg = cfg or {}
    grid = Grid1D()
    ds = GaussianProcessDataset(GPDatasetConfig(grid=grid))
    dl = DataLoader(ds, batch_size=16, shuffle=True)

    vae_cfg = VAEConfig(
        encoder=EncoderConfig(in_dim=grid.num, latent_dim=8),
        branch=BranchNetConfig(latent_dim=8),
        trunk=TrunkNetConfig(coord_dim=1),
    )
    vae = FunctionalVAE(vae_cfg)
    opt = torch.optim.Adam(vae.parameters(), lr=1e-3)
    epochs = int(cfg.get("epochs", 1))
    for _ in range(epochs):
        for x, y in dl:
            recon, kl, _ = vae(x, y)
            loss = torch.mean((recon - y) ** 2) + kl
            opt.zero_grad()
            loss.backward()
            opt.step()

    # latent flow training using encoded latents
    with torch.no_grad():
        z0 = []
        for x, y in dl:
            _, _, z = vae(x, y)
            z0.append(z)
        z0 = torch.cat(z0, dim=0)
    flow_cfg = FlowConfig(latent_dim=z0.size(1))
    flow = LatentFlow(flow_cfg)
    flow_steps = int(cfg.get("flow_steps", 200))
    train_flow(flow, z0, steps=flow_steps)

    out_dir = cfg.get("out_dir", DEFAULT_OUT)
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    torch.save(vae.state_dict(), Path(out_dir) / "vae.pt")
    torch.save(flow.state_dict(), Path(out_dir) / "flow.pt")
    meta = {"latent_dim": z0.size(1)}
    with open(Path(out_dir) / "meta.json", "w") as f:
        json.dump(meta, f)
    return meta


if __name__ == "__main__":  # pragma: no cover
    train()
