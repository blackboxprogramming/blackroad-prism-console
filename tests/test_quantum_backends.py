from lucidia.quantum_engine.backends import backend_names, get_backend


def test_default_backend_is_torchquantum() -> None:
    backend = get_backend()
    assert backend.name == 'torchquantum'


def test_backend_names_contains_default() -> None:
    names = backend_names()
    assert 'torchquantum' in names
