"""Trinary logic with classical and Ψ′ operators.

The module defines a small trinary logic system with values ``{-1, 0, 1}``.
Classical operators (:func:`t_and`, :func:`t_or`, :func:`t_not`,
:func:`t_xor`) as well as whimsical Ψ′ operators
(:func:`psi_merge`, :func:`psi_fold`, :func:`psi_collapse`) are provided.

The :func:`generate_truth_tables` helper exports truth tables for all
operators into JSON and NetworkX graph formats.  The data is written to an
``output/logic`` directory relative to the repository root.
"""

from __future__ import annotations

import itertools
import json
from pathlib import Path
from typing import Callable, Dict, Iterable, Tuple

import networkx as nx
import numpy as np

TRI_VALUES = (-1, 0, 1)


def t_and(a: int, b: int) -> int:
    """Trinary logical AND defined as the minimum of the operands."""

    return int(min(a, b))


def t_or(a: int, b: int) -> int:
    """Trinary logical OR defined as the maximum of the operands."""

    return int(max(a, b))


def t_not(a: int) -> int:
    """Trinary logical NOT implemented as negation."""

    return int(-a)


def t_xor(a: int, b: int) -> int:
    """Trinary XOR implemented as the product of ``a`` and ``-b``."""

    return int(a * -b)


def psi_merge(a: int, b: int) -> int:
    """Ψ′ paradox merge operator.

    Returns ``0`` when the operands agree and ``1`` otherwise.  The value ``-1``
    is treated as a contradiction state and therefore always yields ``1`` when
    paired with any other value.
    """

    if a == b and a != -1:
        return 0
    return 1


def psi_fold(a: int, b: int) -> int:
    """Ψ′ infinite fold operator represented as multiplication."""

    return int(a * b)


def psi_collapse(a: int) -> int:
    """Ψ′ collapse operator that maps any value to ``0``."""

    return 0


BINARY_OPERATORS: Dict[str, Callable[[int, int], int]] = {
    "AND": t_and,
    "OR": t_or,
    "XOR": t_xor,
    "⊕": psi_merge,
    "⊗": psi_fold,
}

UNARY_OPERATORS: Dict[str, Callable[[int], int]] = {
    "NOT": t_not,
    "↯": psi_collapse,
}


def _truth_table(
    op: Callable[..., int],
    values: Iterable[int],
    unary: bool = False,
) -> Dict[Tuple[int, int] | Tuple[int], int]:
    """Return the truth table for ``op`` over ``values``."""

    table: Dict[Tuple[int, int] | Tuple[int], int] = {}
    if unary:
        for a in values:
            table[(a,)] = op(a)
    else:
        for a, b in itertools.product(values, repeat=2):
            table[(a, b)] = op(a, b)
    return table


def generate_truth_tables(output_dir: Path | str = Path("output/logic")) -> Dict[str, dict]:
    """Generate truth tables for all operators and write them to ``output_dir``.

    The function creates three artefacts:

    * ``truth_tables.json`` – JSON serialisation of all tables.
    * ``matrices.npy`` – NumPy array with each table represented as a matrix.
    * ``logic.gexf`` – A NetworkX graph describing value transitions.
    """

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    tables: Dict[str, dict] = {}
    matrices: Dict[str, np.ndarray] = {}
    graph = nx.DiGraph()

    for name, op in BINARY_OPERATORS.items():
        table = _truth_table(op, TRI_VALUES)
        tables[name] = {f"{a},{b}": res for (a, b), res in table.items()}
        matrices[name] = np.array(
            [[op(a, b) for b in TRI_VALUES] for a in TRI_VALUES], dtype=int
        )
        for (a, b), res in table.items():
            graph.add_edge(f"{a},{b}", str(res))

    for name, op in UNARY_OPERATORS.items():
        table = _truth_table(op, TRI_VALUES, unary=True)
        tables[name] = {f"{a}": res for (a,), res in table.items()}
        matrices[name] = np.array([[op(a) for a in TRI_VALUES]], dtype=int)
        for (a,), res in table.items():
            graph.add_edge(f"{a}", str(res))

    with (out / "truth_tables.json").open("w", encoding="utf8") as fh:
        json.dump(tables, fh, indent=2)
    np.save(out / "matrices.npy", matrices)
    nx.write_gexf(graph, out / "logic.gexf")

    return tables


def demo() -> Dict[str, dict]:
    """Run :func:`generate_truth_tables` and return the produced tables."""

    return generate_truth_tables()
