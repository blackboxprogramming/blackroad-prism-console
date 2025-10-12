import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from workflows import dsl


def test_eval_when_allows_basic_expressions():
    context = {"steps": [{"ok": True, "content": "done"}]}

    assert dsl._eval_when('{{ steps[-1]["ok"] }}', context)


@pytest.mark.parametrize(
    "expr",
    [
        "steps.__class__",
        "steps.__class__.__mro__[1].__subclasses__()",
        "__import__('os').system('echo hacked')",
        "{{ steps.__class__ }}",
        "{{ steps.__class__.__mro__[1].__subclasses__() }}",
    ],
)
def test_eval_when_rejects_dangerous_expressions(expr):
    assert dsl._eval_when(expr, {"steps": []}) is False


def test_eval_when_handles_boolean_operations():
    context = {"steps": [{"ok": False}, {"ok": True}]}

    assert dsl._eval_when("not steps[0]['ok'] and steps[1]['ok']", context)
