from lucidia_reason.trinary import TruthValue, neg, and3, or3, imp3, conflict


def test_neg():
    assert neg(TruthValue.TRUE) is TruthValue.FALSE


def test_and3():
    assert and3(TruthValue.TRUE, TruthValue.TRUE) is TruthValue.TRUE
    assert and3(TruthValue.TRUE, TruthValue.UNKNOWN) is TruthValue.UNKNOWN
    assert and3(TruthValue.FALSE, TruthValue.TRUE) is TruthValue.FALSE


def test_or3():
    assert or3(TruthValue.FALSE, TruthValue.FALSE) is TruthValue.FALSE
    assert or3(TruthValue.UNKNOWN, TruthValue.FALSE) is TruthValue.UNKNOWN
    assert or3(TruthValue.TRUE, TruthValue.FALSE) is TruthValue.TRUE


def test_imp3():
    assert imp3(TruthValue.TRUE, TruthValue.FALSE) is TruthValue.FALSE


def test_conflict():
    assert conflict(TruthValue.TRUE, TruthValue.FALSE) is TruthValue.FALSE
    assert conflict(TruthValue.TRUE, TruthValue.TRUE) is TruthValue.TRUE
