import json
from pathlib import Path

import numpy as np

from lucidia_infinity import finance, fractals, logic, numbers, primes, proofs, waves


def test_logic_demo(tmp_path):
    out = logic.generate_truth_tables(tmp_path)
    assert "AND" in out


def test_primes_demo(tmp_path):
    meta = primes.demo(tmp_path)
    for path in meta.values():
        assert Path(path).exists()


def test_proofs_demo(tmp_path, monkeypatch):
    log = tmp_path / "log.json"
    monkeypatch.setattr(proofs, "LOG_FILE", log)
    assert proofs.demo() is True
    data = json.loads(log.read_text())
    assert data


def test_waves_demo(tmp_path):
    path = waves.visualize_interference(waves.SineWave(1), waves.SineWave(2), tmp_path / "img.png")
    assert Path(path).exists()


def test_finance_demo(tmp_path):
    meta = finance.demo(steps=2, output_dir=tmp_path)
    assert Path(meta["log"]).exists()


def test_numbers_demo():
    f, d, w = numbers.demo()
    assert f.dimension >= 2.0
    assert d.unit == "m*s"
    assert np.isclose(w.phase, 1.0)


def test_fractals_demo(tmp_path):
    path = fractals.generate_fractal(output_dir=tmp_path)
    assert Path(path).exists()
