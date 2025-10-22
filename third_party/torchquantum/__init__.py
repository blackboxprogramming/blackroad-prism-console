"""Safe access to the vendored TorchQuantum package."""
from __future__ import annotations

import importlib
import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import torch

# Ensure the vendored source tree is importable before touching the package.
_VENDORED_SRC = Path(__file__).resolve().parents[2] / "envs" / "quantum" / "src"
_PROJECT_ROOT = _VENDORED_SRC / "torchquantum"
for candidate in (str(_PROJECT_ROOT), str(_VENDORED_SRC)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

# TorchQuantum expects ``qiskit`` to exist for a post-import sanity check even
# when we never load the actual plugin modules.  Provide a lightweight stub so
# the import succeeds without pulling the heavy dependency.
if importlib.util.find_spec("qiskit") is None:
    _stub = ModuleType("qiskit")
    _stub.__file__ = str(_VENDORED_SRC / "torchquantum" / "_qiskit_stub.py")
    _stub.__path__ = []  # type: ignore[attr-defined]
    sys.modules.setdefault("qiskit", _stub)

# Import the real vendored package and ensure we did not accidentally pick up a
# system installation.
_torchquantum = importlib.import_module("torchquantum")
_vendor_pkg = (_PROJECT_ROOT / "torchquantum").resolve()
_module_file = getattr(_torchquantum, "__file__", None)
if _module_file is None:
    raise ImportError("Vendored torchquantum module is missing a __file__ attribute")
_module_path = Path(_module_file).resolve()
if not str(_module_path).startswith(str(_vendor_pkg)):
    raise ImportError(
        "Vendored torchquantum module not found; refusing to use system package"
    )

# Re-export the public API so that existing imports continue to work.
_module = sys.modules[__name__]
public_names = getattr(_torchquantum, "__all__", None)
if public_names is None:
    public_names = [name for name in dir(_torchquantum) if not name.startswith("_")]

for name in public_names:
    setattr(_module, name, getattr(_torchquantum, name))

_module.__doc__ = _torchquantum.__doc__
_module.__all__ = list(public_names)
_module.__file__ = getattr(_torchquantum, "__file__", __file__)
_module.__path__ = [str(_vendor_pkg)]

# Pull in the lightweight noise model stubs when Qiskit integrations are disabled
# so downstream code can still perform isinstance checks.
_noise_mod = importlib.import_module("torchquantum.noise_model")
for _name in (
    "NoiseModelTQ",
    "NoiseModelTQActivation",
    "NoiseModelTQPhase",
    "NoiseModelTQReadoutOnly",
    "NoiseModelTQActivationReadout",
    "NoiseModelTQPhaseReadout",
    "NoiseModelTQQErrorOnly",
):
    if not hasattr(_module, _name) and hasattr(_noise_mod, _name):
        value = getattr(_noise_mod, _name)
        setattr(_module, _name, value)
        setattr(_torchquantum, _name, value)
        if _name not in _module.__all__:
            _module.__all__.append(_name)


def _expose_primary_parameter(cls, alias: str) -> None:
    """Expose ``alias`` as a view onto ``cls.params`` if missing."""

    if hasattr(cls, alias):
        return

    def _getter(self):
        return self.params

    setattr(cls, alias, property(_getter))


for _gate_cls, _alias in (
    (_module.RX, "theta"),
    (_module.RY, "theta"),
    (_module.RZ, "theta"),
):
    _expose_primary_parameter(_gate_cls, _alias)


_measurements = importlib.import_module("torchquantum.measurement.measurements")


def _expval_z(self, wire: int):
    result = _measurements.expval(self, wire, _torchquantum.PauliZ())
    return result.squeeze(-1)


def _measure_all(self):
    values = [_expval_z(self, w) for w in range(self.n_wires)]
    return torch.stack(values, dim=1)


for _cls in (_torchquantum.QuantumDevice, _module.QuantumDevice):
    if not hasattr(_cls, "expval_z"):
        setattr(_cls, "expval_z", _expval_z)
    if not hasattr(_cls, "measure_all"):
        setattr(_cls, "measure_all", _measure_all)
from torch import nn

I2 = torch.eye(2, dtype=torch.cfloat)

class QuantumDevice:
    def __init__(self, n_wires, bsz=1, device='cpu'):
        self.n_wires = n_wires
        self.bsz = bsz
        self.device = device
        dim = 2 ** n_wires
        self.state = torch.zeros(bsz, dim, dtype=torch.cfloat, device=device)
        self.state[:, 0] = 1
        self.ops = []

    def _kron(self, mats):
        res = mats[0]
        for m in mats[1:]:
            res = torch.kron(res, m)
        return res

    def _apply_matrix(self, mat, wire):
        mats = []
        for i in range(self.n_wires):
            mats.append(mat if i == wire else I2.to(mat.device))
        full = self._kron(mats)
        self.state = torch.matmul(self.state, full.transpose(-2, -1))

    def apply(self, name, mat, wire, params=None):
        self.ops.append((name, wire, params))
        self._apply_matrix(mat, wire)

    def expval_z(self, wire):
        mats = []
        Z = torch.tensor([[1, 0], [0, -1]], dtype=torch.cfloat, device=self.state.device)
        for i in range(self.n_wires):
            mats.append(Z if i == wire else I2.to(self.state.device))
        full = self._kron(mats)
        psi = self.state
        tmp = torch.matmul(psi, full.transpose(-2, -1))
        return torch.sum(psi.conj() * tmp, dim=1).real

    def measure_all(self):
        vals = [self.expval_z(w) for w in range(self.n_wires)]
        return torch.stack(vals, dim=1)

    def qasm(self):
        lines = []
        for name, wire, params in self.ops:
            if params is None:
                lines.append(f"{name} q[{wire}]")
            else:
                lines.append(f"{name}({float(params[0])}) q[{wire}]")
        return "\n".join(lines)

    def prob_11(self, wires):
        dim = 2 ** self.n_wires
        idxs = []
        for i in range(dim):
            keep = True
            for w in wires:
                if not ((i >> w) & 1):
                    keep = False
                    break
            if keep:
                idxs.append(i)
        amps = self.state[:, idxs]
        return (amps.abs() ** 2).sum(dim=1)

class RX(nn.Module):
    def __init__(self, trainable=True, bias=True):
        super().__init__()
        if trainable:
            self.theta = nn.Parameter(torch.zeros(1))
        else:
            self.register_buffer('theta', torch.zeros(1))

    def forward(self, qdev, wires):
        t = self.theta
        c = torch.cos(t / 2).to(torch.cfloat)
        s = (-1j * torch.sin(t / 2)).to(torch.cfloat)
        row0 = torch.stack((c, s), dim=0).squeeze(-1)
        row1 = torch.stack((s, c), dim=0).squeeze(-1)
        mat = torch.stack([row0, row1], dim=0)
        qdev.apply('rx', mat, wires, params=[t])

class RY(nn.Module):
    def __init__(self, trainable=True, bias=True):
        super().__init__()
        if trainable:
            self.theta = nn.Parameter(torch.zeros(1))
        else:
            self.register_buffer('theta', torch.zeros(1))

    def forward(self, qdev, wires):
        t = self.theta
        c = torch.cos(t / 2).to(torch.cfloat)
        s = torch.sin(t / 2).to(torch.cfloat)
        row0 = torch.stack((c, -s), dim=0).squeeze(-1)
        row1 = torch.stack((s, c), dim=0).squeeze(-1)
        mat = torch.stack([row0, row1], dim=0)
        qdev.apply('ry', mat, wires, params=[t])

class RZ(nn.Module):
    def __init__(self, trainable=True, bias=True):
        super().__init__()
        if trainable:
            self.theta = nn.Parameter(torch.zeros(1))
        else:
            self.register_buffer('theta', torch.zeros(1))

    def forward(self, qdev, wires):
        t = self.theta
        e = torch.exp(-0.5j * t).to(torch.cfloat)
        zero = torch.zeros_like(e)
        row0 = torch.stack((e, zero), dim=0).squeeze(-1)
        row1 = torch.stack((zero, e.conj()), dim=0).squeeze(-1)
        mat = torch.stack([row0, row1], dim=0)
        qdev.apply('rz', mat, wires, params=[t])

class PauliZ:
    matrix = torch.tensor([[1, 0], [0, -1]], dtype=torch.cfloat)

class MeasureAll(nn.Module):
    def __init__(self, observable):
        super().__init__()
        self.observable = observable

    def forward(self, qdev):
        return qdev.measure_all()

class RandomLayer(nn.Module):
    def forward(self, qdev):
        return qdev

class QFTLayer(nn.Module):
    def forward(self, qdev):
        return qdev
