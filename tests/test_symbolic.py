

from lib.symbolic import Tri, tri_mark, detect_contradictions, ps_sha_infinity

def test_tri_mark():
    assert tri_mark(1) == "TRUE(+1)"
    assert tri_mark(0) == "NULL(0)"
    assert tri_mark(-1).startswith("CONTRA")

def test_detect_contradictions():
    t = "result: ⟂ inconsistency found"
    notes = detect_contradictions(t)
    assert notes and "⟂ note" in notes[0].note

def test_ps_sha_infinity():
    code = ps_sha_infinity("seed", "2025-08-18|blackboxprogramming|copilot")
    assert len(code) == 16

