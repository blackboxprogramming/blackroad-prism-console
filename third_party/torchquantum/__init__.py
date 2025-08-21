import math
import torch
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
        self.state = torch.matmul(self.state, full.T)

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
        return torch.einsum('bi,ij,bj->b', psi.conj(), full, psi).real

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
        c = torch.cos(t / 2)
        s = -1j * torch.sin(t / 2)
        mat = torch.stack([torch.stack([c, s]), torch.stack([s, c])])
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
        c = torch.cos(t / 2)
        s = torch.sin(t / 2)
        mat = torch.stack([torch.stack([c, -s]), torch.stack([s, c])]).to(torch.cfloat)
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
        e = torch.exp(-0.5j * t)
        mat = torch.stack([torch.stack([e, torch.zeros_like(e)]), torch.stack([torch.zeros_like(e), e.conj()])])
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
