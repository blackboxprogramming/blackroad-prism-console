from enablement import quizzes


def test_quiz_grading():
    res = quizzes.grade("Q-SE-101", "fixtures/enablement/submissions/U_SE01_Q-SE-101.json")
    assert res["score"] == 100
    assert res["pass"] is True
