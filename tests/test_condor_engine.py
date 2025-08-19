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
