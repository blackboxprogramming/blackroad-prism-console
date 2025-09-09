"""Care–Noether current prototype."""
from __future__ import annotations

from typing import Iterable
import numpy as np


def care_current(vectors: Iterable[np.ndarray], deltas: Iterable[np.ndarray]) -> np.ndarray:
    """Compute a simple discrete care current.

    Parameters
    ----------
    vectors: iterable of semantic vectors for each token.
    deltas: iterable of variations produced by a paraphrase.

    Returns
    -------
    np.ndarray representing the care current.  Zero indicates preserved
    meaning under the given transformation.
    """

    vec = np.stack(list(vectors))
    deltas = np.stack(list(deltas))
    return (vec * deltas).sum(axis=0)


__all__ = ["care_current"]
