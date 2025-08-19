"""Constrained Latent Flow Matching (c-LFM) module.

This package provides a lightweight, clean-room implementation of the
Constrained Latent Flow Matching model described in the 2025 paper.
The focus here is on providing simple, CPU friendly building blocks that
can be expanded upon for research and prototyping.  Only minimal features
are implemented but the public API mirrors the full project.
"""

from .cli.train import train
from .cli.sample import sample
from .cli.eval import evaluate

__all__ = ["train", "sample", "evaluate"]
