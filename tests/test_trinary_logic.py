import numpy as np

from lucidia_math_lab.trinary_logic import TrinaryLogicEngine


def test_operate_and():
    engine = TrinaryLogicEngine.from_json("lucidia_math_lab/trinary_operators.json")
    assert engine.operate("AND", 1, -1) == -1


def test_truth_table_ascii():
    engine = TrinaryLogicEngine.from_json("lucidia_math_lab/trinary_operators.json")
    table = engine.truth_table("OR")
    assert table.shape == (3, 3)
    ascii_table = engine.truth_table_ascii("OR")
    assert isinstance(ascii_table, str)
