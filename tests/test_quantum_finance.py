from lucidia_math_lab.quantum_finance import QuantumFinanceSimulator


def test_step_and_observe():
    sim = QuantumFinanceSimulator(price=100.0, volatility=1.0)
    dist = sim.step(samples=100)
    price = sim.observe(dist)
    assert isinstance(price, float)
    assert len(sim.history) == 1
