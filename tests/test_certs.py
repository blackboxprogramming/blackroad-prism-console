from enablement import certify, labs, quizzes


def test_cert_award():
    quizzes.grade("Q-SE-101", "fixtures/enablement/submissions/U_SE01_Q-SE-101.json")
    labs.run_lab("L-SE-CLI", "fixtures/enablement/submissions/U_SE01_L-SE-CLI.json")
    ok = certify.check("U_SE01", "CERT-SE-ASSOC")
    assert ok is True
    assert "CERT-SE-ASSOC" in certify.list_user("U_SE01")
