"""Trinary logic engine supporting custom operators and visualizations."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import networkx as nx
import numpy as np


TRIT_VALUES: List[int] = [-1, 0, 1]


@dataclass
class TrinaryLogicEngine:
    """Engine that evaluates trinary logic expressions."""

    operators: Dict[str, Dict]

    @classmethod
    def from_json(cls, path: str | Path) -> "TrinaryLogicEngine":
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return cls(data)

    def operate(self, op: str, a: int, b: int | None = None) -> int:
        """Evaluate a trinary operation."""

        if op == "NOT":
            if b is not None:
                raise ValueError("NOT takes a single argument")
            return int(self.operators[op][str(a)])
        if b is None:
            raise ValueError("Binary operator requires two arguments")
        return int(self.operators[op][str(a)][str(b)])

    def truth_table(self, op: str) -> np.ndarray:
        """Return the truth table for an operator as a matrix."""

        if op == "NOT":
            table = np.zeros((len(TRIT_VALUES), 2), dtype=int)
            for i, a in enumerate(TRIT_VALUES):
                table[i] = [a, self.operate(op, a)]
            return table
        table = np.zeros((len(TRIT_VALUES), len(TRIT_VALUES)), dtype=int)
        for i, a in enumerate(TRIT_VALUES):
            for j, b in enumerate(TRIT_VALUES):
                table[i, j] = self.operate(op, a, b)
        return table

    def truth_table_ascii(self, op: str) -> str:
        """Render a truth table as ASCII art."""

        table = self.truth_table(op)
        return "\n".join(" ".join(f"{v:+d}" for v in row) for row in table)

    def to_graph(self, op: str) -> nx.DiGraph:
        """Visualize operator relations as a directed graph."""

        g = nx.DiGraph()
        if op == "NOT":
            for a in TRIT_VALUES:
                res = self.operate(op, a)
                g.add_edge(a, res, op=op)
            return g

        for a in TRIT_VALUES:
            for b in TRIT_VALUES:
                res = self.operate(op, a, b)
                g.add_edge((a, b), res, op=op)
        return g
