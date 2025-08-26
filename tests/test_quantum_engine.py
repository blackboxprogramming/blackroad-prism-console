import importlib
import pytest

torch = pytest.importorskip("torch", reason="Install torch or ask codex for help")
tq = pytest.importorskip("third_party.torchquantum", reason="Install torchquantum or ask codex for help")

from lucidia.quantum_engine import guard_env, set_seed, enforce_import_block
from lucidia.quantum_engine.models import PQCClassifier


def test_rx_ry_rz_grad():
    model = PQCClassifier(n_wires=3)
    x = torch.zeros(2, 1)
    out = model(x)
    loss = out.sum()
    loss.backward()
    assert model.rx0.theta.grad is not None
    assert model.ry0.theta.grad is not None
    assert model.rz0.theta.grad is not None


def test_sampling_matches_expval():
    qdev = tq.QuantumDevice(n_wires=1, bsz=1)
    gate = tq.RX(True, True)
    gate.theta.data.fill_(torch.pi)
    gate(qdev, wires=0)
    analytic = qdev.expval_z(0)[0]
    probs = (qdev.state.abs() ** 2)[0]
    samples = torch.multinomial(probs, num_samples=1024, replacement=True)
    z_vals = 1 - 2 * samples
    sampled = z_vals.float().mean()
    assert torch.allclose(analytic, sampled, atol=0.1)


def test_seed_reproducible():
    set_seed(123)
    model1 = PQCClassifier()
    out1 = model1(torch.zeros(1, 1))
    set_seed(123)
    model2 = PQCClassifier()
    out2 = model2(torch.zeros(1, 1))
    assert torch.allclose(out1, out2)


def test_policy_import_block():
    enforce_import_block()
    with pytest.raises(ImportError):
        importlib.import_module('torchquantum.plugins')


def test_no_socket():
    guard_env()
    import socket

    with pytest.raises(RuntimeError):
        socket.socket()
