from safety import duty_of_care


def test_duty_safety():
    assert duty_of_care.gate(["SAF_NO_RISKS"]) == "DUTY_SAFETY"


def test_duty_hitl():
    assert duty_of_care.gate([], hitl_approved=False) == "DUTY_HITL"


def test_duty_kg():
    assert duty_of_care.gate([], kg_ok=False) == "DUTY_KG"


def test_duty_ok():
    assert duty_of_care.gate([]) is None
