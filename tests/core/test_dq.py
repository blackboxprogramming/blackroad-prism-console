from dq import checks


def test_missing_values():
    data = [{"a": 1, "b": None}, {"a": 2, "b": ""}]
    res = checks.check_missing_values(data)
    assert res["b"] == 2


def test_outliers():
    data = [{"x": i} for i in [1, 2, 3, 100]]
    res = checks.check_outliers(data, ["x"], threshold=1)
    assert res["x"] == [3]


def test_schema():
    data = [{"a": 1, "b": "x"}]
    res = checks.check_schema(data, {"a": int, "b": str})
    assert res == []
    res2 = checks.check_schema(data, {"a": str})
    assert "a" in res2
