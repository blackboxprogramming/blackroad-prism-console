from enablement import labs


def test_lab_run():
    res = labs.run_lab("L-SE-CLI", "fixtures/enablement/submissions/U_SE01_L-SE-CLI.json")
    assert res["passed"] is True
