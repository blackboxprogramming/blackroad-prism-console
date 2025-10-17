"""Quantum contradiction resolver for Codex Infinity.

This agent binds entries in ``contradiction_log.json`` to a small
quantum circuit.  Each logged contradiction is interpreted as one of
three symbols:

``0`` -> :math:`|0\rangle`
``1`` -> :math:`|1\rangle`
``"\u03a8"`` -> :math:`|+\rangle`

The circuit is repeatedly executed until two consecutive measurements
agree.  Whenever the measurement outcome changes between iterations a
"Road Skip" event is appended to the contradiction log.  The function
returns the full trace of measurements which represents the collapse of
the truth state.

The implementation tries to use ``qiskit`` or ``pennylane`` if either is
installed.  When neither backend is available a lightweight
``numpy``-based simulator is used instead.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Iterable, List

import numpy as np

try:  # pragma: no cover - optional dependency
    from qiskit import Aer, QuantumCircuit, execute  # type: ignore

    _HAS_QISKIT = True
except Exception:  # pragma: no cover - dependency missing
    _HAS_QISKIT = False

try:  # pragma: no cover - optional dependency
    import pennylane as qml  # type: ignore

    _HAS_PENNYLANE = True
except Exception:  # pragma: no cover - dependency missing
    _HAS_PENNYLANE = False

LOG_FILE = Path("contradiction_log.json")
ROAD_SKIP_LOG_FILE = Path("road_skip_log.json")


_DEF_MAPPING = {
    "0": np.array([1.0, 0.0], dtype=complex),
    "1": np.array([0.0, 1.0], dtype=complex),
    "\u03a8": np.array([1 / math.sqrt(2), 1 / math.sqrt(2)], dtype=complex),
}


_ENGLISH_MAPPING = {
    "0": "Zero / False state (|0⟩)",
    "1": "One / True state (|1⟩)",
    "\u03a8": "Superposition / Maybe state (|+⟩)",
}


def _safe_read_json_array(log_file: Path) -> List[Any]:
    """Return a JSON array stored at ``log_file`` or ``[]`` when missing."""

    if log_file.exists():
        try:
            data = json.loads(log_file.read_text())
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            return []
    return []


def _load_contradictions(log_file: Path = LOG_FILE) -> List[str]:
    """Load contradiction entries from ``log_file``.

    If the file is absent an empty list is returned.  The log is expected
    to contain a JSON array of symbols.
    """

    data = _safe_read_json_array(log_file)
    return [str(item) for item in data if isinstance(item, str)]


def _load_road_skips(log_file: Path = ROAD_SKIP_LOG_FILE) -> List[dict]:
    """Load stored "Road Skip" events."""

    data = _safe_read_json_array(log_file)
    return [item for item in data if isinstance(item, dict)]


def _log_road_skip(event: dict, log_file: Path = ROAD_SKIP_LOG_FILE) -> None:
    """Append a "Road Skip" tunnelling event to the dedicated log file."""

    data = _load_road_skips(log_file)
    data.append(event)
    log_file.write_text(json.dumps(data, indent=2))


def _run_numpy(states: Iterable[str]) -> List[int]:
    """Simulate measurement using a minimal ``numpy`` backend."""

    outcomes: List[int] = []
    for sym in states:
        vec = _DEF_MAPPING.get(sym, _DEF_MAPPING["\u03a8"])
        probs = np.abs(vec) ** 2
        outcomes.append(int(np.random.choice([0, 1], p=probs)))
    return outcomes


def _run_qiskit(states: Iterable[str]) -> List[int]:  # pragma: no cover - optional
    n = len(list(states))
    qc = QuantumCircuit(n, n)
    for i, sym in enumerate(states):
        if sym == "1":
            qc.x(i)
        elif sym == "\u03a8":
            qc.h(i)
    qc.measure(range(n), range(n))
    backend = Aer.get_backend("qasm_simulator")
    job = execute(qc, backend=backend, shots=1)
    bitstring = next(iter(job.result().get_counts()))
    return [int(b) for b in bitstring[::-1]]


def _run_pennylane(states: Iterable[str]) -> List[int]:  # pragma: no cover - optional
    wires = len(list(states))
    dev = qml.device("default.qubit", wires=wires, shots=1)

    @qml.qnode(dev)
    def circuit() -> List[int]:
        for i, sym in enumerate(states):
            if sym == "1":
                qml.PauliX(i)
            elif sym == "\u03a8":
                qml.Hadamard(i)
        return [qml.sample(qml.PauliZ(i)) for i in range(wires)]

    sample = circuit()
    # ``sample`` yields values in {+1, -1}; map to bits
    return [0 if int(s) == 1 else 1 for s in sample]


def _run_once(states: List[str]) -> List[int]:
    """Execute one measurement round using the best available backend."""

    if _HAS_QISKIT:
        return _run_qiskit(states)
    if _HAS_PENNYLANE:
        return _run_pennylane(states)
    return _run_numpy(states)


def invoke_quantum(max_iter: int = 10) -> List[List[int]]:
    """Run the quantum contradiction resolver.

    The function repeatedly measures the mapped contradictions until two
    consecutive measurements match.  Each intermediate measurement is
    recorded in the returned trace.  When a measurement differs from the
    previous one a "Road Skip" event is logged.

    Args:
        max_iter: Maximum number of measurement rounds.

    Returns:
        A list of measurement results; the last element is the collapsed
        truth state.
    """

    states = _load_contradictions()
    if not states:
        return []

    trace: List[List[int]] = []
    prev: List[int] | None = None
    for i in range(max_iter):
        result = _run_once(states)
        trace.append(result)
        if result == prev:
            break
        if prev is not None:
            _log_road_skip({"event": "Road Skip", "iteration": i, "from": prev, "to": result})
        prev = result
    return trace


def describe_symbols(states: Iterable[str]) -> List[str]:
    """Translate contradiction symbols into human-readable English labels."""

    descriptions: List[str] = []
    for sym in states:
        sym_str = str(sym)
        descriptions.append(_ENGLISH_MAPPING.get(sym_str, f"Unknown symbol {sym_str!r}"))
    return descriptions


__all__ = ["invoke_quantum", "describe_symbols"]
