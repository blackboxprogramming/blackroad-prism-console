"""Registry for Ψ′ operator mapping to Python callables."""
from __future__ import annotations
from typing import Callable, Dict

from . import trinary


Operator = Callable[..., trinary.TruthValue]


REGISTRY: Dict[str, Operator] = {
    "neg": trinary.neg,
    "and3": trinary.and3,
    "or3": trinary.or3,
    "imp3": trinary.imp3,
    "conflict": trinary.conflict,
}


def get_operator(name: str) -> Operator:
    """Return operator by name."""
    return REGISTRY[name]
