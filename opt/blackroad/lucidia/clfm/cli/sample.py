"""Sampling utilities for c-LFM."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import torch

from ..core.deeponet import BranchNetConfig, TrunkNetConfig
from ..core.vae import EncoderConfig, FunctionalVAE, VAEConfig
from ..core.flow import FlowConfig, LatentFlow, sample_flow
from ..core.grid import Grid1D

DEFAULT_OUT = Path("opt/blackroad/lucidia/artifacts")


def sample(cfg: Optional[dict] = None, n: int = 1) -> torch.Tensor:
    cfg = cfg or {}
    out_dir = Path(cfg.get("out_dir", DEFAULT_OUT))
    with open(out_dir / "meta.json") as f:
        meta = json.load(f)
    latent_dim = meta["latent_dim"]

    grid = Grid1D()
    vae_cfg = VAEConfig(
        encoder=EncoderConfig(in_dim=grid.num, latent_dim=latent_dim),
        branch=BranchNetConfig(latent_dim=latent_dim),
        trunk=TrunkNetConfig(coord_dim=1),
    )
    vae = FunctionalVAE(vae_cfg)
    vae.load_state_dict(torch.load(out_dir / "vae.pt", map_location="cpu"))

    flow = LatentFlow(FlowConfig(latent_dim=latent_dim))
    flow.load_state_dict(torch.load(out_dir / "flow.pt", map_location="cpu"))

    z = sample_flow(flow, n, torch.device("cpu"))
    x = grid.linspace(torch.device("cpu"))
    samples = vae.decode(z, x)
    torch.save(samples, out_dir / "samples.pt")
    return samples


if __name__ == "__main__":  # pragma: no cover
    sample()
