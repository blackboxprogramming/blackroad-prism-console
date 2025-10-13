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
