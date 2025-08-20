from libcst import parse_module
from codemods.rename_foo_to_bar import codemod


def test_simple():
    src = "def foo():\n    return foo"
    out = codemod(parse_module(src)).code
    assert out == "def bar():\n    return bar"
