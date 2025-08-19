import pytest

from lucidia.engines import condor_engine


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
    assert result == {'x': 1}
