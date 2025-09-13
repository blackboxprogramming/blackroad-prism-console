from enablement import feedback


def test_feedback_flow():
    feedback.add("C101", "U_SE01", 9, "Loved the labs")
    summary = feedback.summary("C101")
    assert summary["nps"] == 100
    assert "loved" in summary["keywords"]
