"""Model definitions for the Modern Hopfield transformer experiment."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import torch
from torch import Tensor, nn


@dataclass
class HopfieldReadout:
    """Container for Hopfield read outputs."""

    logits: Tensor
    energies: Tensor
    attention: Tensor


class PatchEmbedding(nn.Module):
    """Embed 2-D images into a sequence of patch tokens."""

    def __init__(
        self,
        img_size: int = 32,
        patch_size: int = 4,
        in_channels: int = 3,
        embed_dim: int = 192,
    ) -> None:
        super().__init__()
        if img_size % patch_size != 0:
            raise ValueError("Image size must be divisible by patch size.")
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.num_patches = (img_size // patch_size) ** 2

    def forward(self, x: Tensor) -> Tensor:
        bsz = x.shape[0]
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)
        assert x.shape[1] == self.num_patches
        return x


class TransformerEncoderBlock(nn.Module):
    """A light-weight transformer encoder block used for CIFAR-10."""

    def __init__(
        self,
        embed_dim: int,
        num_heads: int,
        mlp_ratio: float = 4.0,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=False)
        self.drop_path = nn.Dropout(dropout)
        self.norm2 = nn.LayerNorm(embed_dim)
        mlp_hidden = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden, embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x: Tensor) -> Tensor:
        # MultiheadAttention expects sequence first.
        y = self.norm1(x)
        attn_out, _ = self.attn(y, y, y, need_weights=False)
        x = x + self.drop_path(attn_out)
        x = x + self.mlp(self.norm2(x))
        return x


class ModernHopfieldHead(nn.Module):
    """Modern Hopfield memory with EMA writes and energy-based readout."""

    def __init__(
        self,
        embed_dim: int,
        proj_dim: int,
        memory_init: Tensor,
        beta: float = 20.0,
        momentum: float = 0.1,
        disabled: bool = False,
    ) -> None:
        super().__init__()
        if memory_init.ndim != 2:
            raise ValueError("memory_init must be rank-2 [mem_size, embed_dim].")
        self.embed_dim = embed_dim
        self.proj_dim = proj_dim
        self.beta = beta
        self.momentum = momentum
        self.disabled = disabled
        # Memory patterns stored as parameters but excluded from gradient updates.
        self.memory_bank = nn.Parameter(memory_init.clone(), requires_grad=False)
        self.phi = nn.Linear(embed_dim, proj_dim, bias=False)
        nn.init.orthogonal_(self.phi.weight)

    @property
    def mem_size(self) -> int:
        return int(self.memory_bank.shape[0])

    def forward(self, queries: Tensor) -> HopfieldReadout:
        if self.disabled:
            raise RuntimeError("Hopfield head is disabled; forward should not be called.")
        projected_queries = self.phi(queries)
        projected_memory = self.phi(self.memory_bank)
        # Energy: E(x) = -log sum_i exp(beta * phi(x)^T phi(x_i)).
        logits = self.beta * projected_queries @ projected_memory.t()
        energies = -torch.logsumexp(logits, dim=1)
        attention = torch.softmax(logits, dim=1)
        return HopfieldReadout(logits=logits, energies=energies, attention=attention)

    def update(self, encodings: Tensor, indices: Tensor, momentum: Optional[float] = None) -> None:
        if self.disabled:
            return
        if momentum is None:
            momentum = self.momentum
        with torch.no_grad():
            for vector, index in zip(encodings, indices):
                idx = int(index.item())
                # EMA write: m_i <- (1 - momentum) * m_i + momentum * x.
                self.memory_bank[idx].lerp_(vector, momentum)

    def temporary_write(self, encoding: Tensor, index: int, momentum: Optional[float] = None) -> Tensor:
        """Create a temporary memory bank with a one-shot update for evaluation."""
        if self.disabled:
            raise RuntimeError("Hopfield head is disabled; temporary writes are unsupported.")
        if momentum is None:
            momentum = self.momentum
        temp_bank = self.memory_bank.clone()
        temp_bank[index].lerp_(encoding, momentum)
        return temp_bank

    def read_with_bank(self, queries: Tensor, memory_bank: Tensor) -> HopfieldReadout:
        """Read using a provided memory bank (useful for what-if analysis)."""
        if self.disabled:
            raise RuntimeError("Hopfield head is disabled; reads are unsupported.")
        projected_queries = self.phi(queries)
        projected_memory = self.phi(memory_bank)
        logits = self.beta * projected_queries @ projected_memory.t()
        energies = -torch.logsumexp(logits, dim=1)
        attention = torch.softmax(logits, dim=1)
        return HopfieldReadout(logits=logits, energies=energies, attention=attention)


class HopfieldVisionTransformer(nn.Module):
    """Vision transformer augmented with a Modern Hopfield memory head."""

    def __init__(
        self,
        img_size: int,
        patch_size: int,
        in_channels: int,
        embed_dim: int,
        depth: int,
        num_heads: int,
        num_classes: int,
        hopfield_proj_dim: int,
        memory_init: Tensor,
        beta: float,
        dropout: float = 0.1,
        momentum: float = 0.1,
        disable_hopfield: bool = False,
    ) -> None:
        super().__init__()
        self.disable_hopfield = disable_hopfield
        self.patch_embed = PatchEmbedding(
            img_size=img_size,
            patch_size=patch_size,
            in_channels=in_channels,
            embed_dim=embed_dim,
        )
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        num_tokens = 1 + self.patch_embed.num_patches
        self.pos_embed = nn.Parameter(torch.zeros(1, num_tokens, embed_dim))
        self.pos_drop = nn.Dropout(dropout)
        self.blocks = nn.ModuleList(
            [
                TransformerEncoderBlock(embed_dim, num_heads, dropout=dropout)
                for _ in range(depth)
            ]
        )
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.xavier_uniform_(self.head.weight)
        nn.init.zeros_(self.head.bias)
        self.hopfield = ModernHopfieldHead(
            embed_dim=embed_dim,
            proj_dim=hopfield_proj_dim,
            memory_init=memory_init,
            beta=beta,
            momentum=momentum,
            disabled=disable_hopfield,
        )

    def forward_features(self, x: Tensor) -> Tensor:
        bsz = x.shape[0]
        x = self.patch_embed(x)
        cls_tokens = self.cls_token.expand(bsz, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        x = x + self.pos_embed
        x = self.pos_drop(x)
        x = x.transpose(0, 1)
        for block in self.blocks:
            x = block(x)
        x = x.transpose(0, 1)
        x = self.norm(x)
        cls = x[:, 0]
        return cls

    def forward(self, x: Tensor, memory_indices: Optional[Tensor] = None) -> Dict[str, Tensor]:
        cls_embedding = self.forward_features(x)
        logits = self.head(cls_embedding)
        output: Dict[str, Tensor] = {"logits": logits, "cls": cls_embedding}
        if not self.disable_hopfield:
            hopfield_read = self.hopfield(cls_embedding)
            output["memory_logits"] = hopfield_read.logits
            output["hopfield_energy"] = hopfield_read.energies
            output["memory_attention"] = hopfield_read.attention
            if memory_indices is not None:
                output["memory_indices"] = memory_indices
        return output

    def write_memory(self, encodings: Tensor, indices: Tensor) -> None:
        if self.disable_hopfield:
            return
        self.hopfield.update(encodings, indices)

    def encode(self, x: Tensor) -> Tensor:
        """Return CLS embeddings without applying the classification head."""
        return self.forward_features(x)

    def read_memory(self, encodings: Tensor) -> HopfieldReadout:
        if self.disable_hopfield:
            raise RuntimeError("Hopfield memory disabled; cannot read.")
        return self.hopfield(encodings)

    def read_with_external_bank(self, encodings: Tensor, memory_bank: Tensor) -> HopfieldReadout:
        if self.disable_hopfield:
            raise RuntimeError("Hopfield memory disabled; cannot read.")
        return self.hopfield.read_with_bank(encodings, memory_bank)

    def temporary_memory(self, encoding: Tensor, index: int) -> Tensor:
        if self.disable_hopfield:
            raise RuntimeError("Hopfield memory disabled; cannot create temp bank.")
        return self.hopfield.temporary_write(encoding, index)

