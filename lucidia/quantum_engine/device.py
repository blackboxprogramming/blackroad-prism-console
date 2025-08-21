"""Device wrapper around torchquantum.QuantumDevice."""
from __future__ import annotations

from third_party import torchquantum as tq

from .policy import guard_env, set_seed


class Device:
    """Lightweight wrapper providing deterministic setup and QASM export."""

    def __init__(self, n_wires: int, bsz: int = 1, device: str = 'cpu', seed: int | None = None):
        guard_env()
        set_seed(seed)
        self.qdev = tq.QuantumDevice(n_wires=n_wires, bsz=bsz, device=device)

    def qasm(self) -> str:
        """Return a QASM-like string of the operations."""
        return self.qdev.qasm()
