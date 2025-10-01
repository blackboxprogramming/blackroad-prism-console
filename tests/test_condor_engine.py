import pytest

from lucidia.engines import condor_engine


def test_validate_disallows_os():
    with pytest.raises(ValueError):
        condor_engine.validate_model_source("import os\n")


def test_validate_allows_condor():
    condor_engine.validate_model_source("import condor\n")


def test_solve_algebraic_with_dummy():
    class Dummy:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

        def solve(self):
            return {"x": 1}

    result = condor_engine.solve_algebraic(Dummy, a=1)
    assert result == {"x": 1}


def test_solve_algebraic_requires_condor_for_real_models(monkeypatch):
    class FakeCondorModel:
        def solve(self):
            return {"x": 1}

    FakeCondorModel.__module__ = "condor.fake"

    monkeypatch.setattr(condor_engine, "condor", None)
    with pytest.raises(RuntimeError, match="Condor is not installed"):
        condor_engine.solve_algebraic(FakeCondorModel)


def test_solve_algebraic_allows_condor_models_when_dependency_present(monkeypatch):
    class FakeCondorModel:
        def solve(self):
            return {"x": 2}

    FakeCondorModel.__module__ = "condor.fake"

    monkeypatch.setattr(condor_engine, "condor", object())
    result = condor_engine.solve_algebraic(FakeCondorModel)
    assert result == {"x": 2}


def test_validate_model_source_allows_basic_imports():
    src = """
import math
class M:
    pass
"""
    condor_engine.validate_model_source(src)


def test_validate_model_source_blocks_bad_imports():
    src = """
import os
"""
    with pytest.raises(ValueError):
        condor_engine.validate_model_source(src)


def test_load_model_from_source():
    src = """
from dataclasses import dataclass

@dataclass
class Example:
    def solve(self):
        return {'x': 1}
"""
    cls = condor_engine.load_model_from_source(src, "Example")
    condor_engine.condor = object()  # type: ignore
    result = condor_engine.solve_algebraic(cls)
    assert result == {"x": 1}
