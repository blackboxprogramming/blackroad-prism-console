"""Utilities for experimenting with Rohonc Codex symbol substitutions."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Mapping, Sequence


DEFAULT_ALPHABET: Sequence[str] = tuple("ABCDEFGHIJKLMNOPQRSTUVWXYZ .,:;!?")


@dataclass(frozen=True)
class RotationalSettings:
    """Parameters controlling the rotational decoding behaviour."""

    theta: float = 1.707
    symbol_space: int = 150
    reset_symbol: str = "tri"


class RohoncDecoder:
    """Decode Rohonc Codex glyph identifiers using substitution heuristics."""

    def __init__(
        self,
        mapping: Mapping[str, str],
        *,
        rotational: RotationalSettings | None = None,
        alphabet: Sequence[str] = DEFAULT_ALPHABET,
    ) -> None:
        self._mapping = dict(mapping)
        self._rotational = rotational or RotationalSettings()
        self._alphabet = list(alphabet)

    def simple_decode(self, symbols: Iterable[str]) -> str:
        """Return a direct substitution string for *symbols*."""

        return "".join(self._mapping.get(symbol, "?") for symbol in symbols)

    def rotational_decode(
        self,
        symbols: Sequence[str],
        *,
        theta: float | None = None,
        reset_symbol: str | None = None,
    ) -> str:
        """Decode *symbols* using a rotational Caesar-like heuristic."""

        effective_theta = theta if theta is not None else self._rotational.theta
        effective_reset = (
            reset_symbol if reset_symbol is not None else self._rotational.reset_symbol
        )

        ordered_symbols: List[str] = list(dict.fromkeys(symbols))
        symbol_to_num = {symbol: index for index, symbol in enumerate(ordered_symbols)}

        decoded: List[str] = []
        shift = 0
        alphabet_size = len(self._alphabet)

        for index, symbol in enumerate(symbols):
            if symbol == effective_reset:
                decoded.append("\n")
                shift = 0
                continue

            raw_value = symbol_to_num.get(symbol, 0)
            decoded_num = (raw_value - shift) % alphabet_size
            decoded.append(self._alphabet[decoded_num])

            shift = int(effective_theta * (index + 1)) % alphabet_size

        return "".join(decoded)

    def scan_thetas(self, symbols: Sequence[str], candidates: Sequence[float]) -> Mapping[float, str]:
        """Return decoded strings for each theta candidate in *candidates*."""

        return {theta: self.rotational_decode(symbols, theta=theta) for theta in candidates}
