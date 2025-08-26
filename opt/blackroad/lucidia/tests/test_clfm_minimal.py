import pytest

torch = pytest.importorskip("torch", reason="Install torch or ask codex for help")

from opt.blackroad.lucidia.clfm.core.deeponet import (
    BranchNet,
    BranchNetConfig,
    TrunkNet,
    TrunkNetConfig,
)
from opt.blackroad.lucidia.clfm.core.losses import stats_residual
from opt.blackroad.lucidia.clfm import train, sample, evaluate


def test_deeponet_shapes():
    b = BranchNet(BranchNetConfig(latent_dim=4, out_dim=8))
    t = TrunkNet(TrunkNetConfig(coord_dim=1, out_dim=8))
    z = torch.randn(2, 4)
    x = torch.randn(5, 1)
    out = (b(z)[:, None, :] * t(x)[None, :, :]).sum(-1)
    assert out.shape == (2, 5)


def test_stats_residual_zero():
    data = torch.randn(10, 3)
    cov = torch.cov(data.T)
    res = stats_residual(data, cov)
    assert torch.allclose(res, torch.tensor(0.0), atol=1e-5)


def test_train_sample_eval_pipeline(tmp_path):
    cfg = {"out_dir": str(tmp_path), "epochs": 1, "flow_steps": 10}
    meta = train(cfg)
    assert "latent_dim" in meta
    samples = sample(cfg, n=2)
    assert samples.shape[0] == 2
    report = evaluate(cfg)
    assert "mse" in report and "cov_residual" in report
