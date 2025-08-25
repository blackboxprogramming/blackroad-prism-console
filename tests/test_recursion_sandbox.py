from lucidia_math_lab.recursion_sandbox import RecursiveSandbox


def test_parse_and_detect():
    sandbox = RecursiveSandbox()
    eq = sandbox.parse_equation("f(x)=f(f(x-1))+1")
    assert sandbox.detect_contradiction("f(x)=f(f(x-1))+1")
    assert str(eq.lhs) == 'f(x)'
