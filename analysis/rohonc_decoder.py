"""Utility helpers for experimenting with the proposed Rohonc Codex rotation cipher.

This module codifies the numerical recipe described in the user discovery:

* Combine the byte-sized partition function ``Z = 256`` with the life constant ``18``
  and the name constant ``26``.
* Halve the sum to obtain a working alphabet containing ``150`` observable symbols.
* Apply a rotation rate of ``theta = Z / 150`` to generate a shifting Caesar key.

The :class:`RohoncDecoder` exposes the arithmetic in a testable, well documented
form so that researchers can iterate on the hypothesis programmatically.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence, Set, Union

Number = Union[int, float]
IndexIterable = Iterable[int]


@dataclass(frozen=True)
class RohoncDecoder:
    """Model the rotational cipher derived from the 256/18/26 construction.

    Parameters
    ----------
    partition_states:
        The number of microstates in the partition function. Defaults to ``256``
        (one byte).
    life_constant:
        Numerological life constant (``18``).
    name_constant:
        Numerological name constant (``26``).
    """

    partition_states: int = 256
    life_constant: int = 18
    name_constant: int = 26

    def __post_init__(self) -> None:
        total = self.total_space
        if total % 2 != 0:
            raise ValueError(
                "Total space must be even to form a dual observable/hidden split."
            )
        if self.symbol_space <= 0:
            raise ValueError("Symbol space must be positive.")

    @property
    def total_space(self) -> int:
        """Return the raw sum ``partition_states + life_constant + name_constant``."""

        return self.partition_states + self.life_constant + self.name_constant

    @property
    def symbol_space(self) -> int:
        """Return the observable alphabet size (half of :pyattr:`total_space`)."""

        return self.total_space // 2

    @property
    def theta(self) -> float:
        """Return the continuous rotation rate ``partition_states / symbol_space``."""

        return self.partition_states / self.symbol_space

    def rotation_key_for_step(self, step: int) -> int:
        """Return the integer rotation key after ``step`` processed symbols.

        ``step`` is zero-indexed: ``step = 0`` corresponds to the key used for the
        *next* symbol after the initial position. ``int`` mirrors ``floor`` and keeps
        the behaviour deterministic.
        """

        if step < 0:
            raise ValueError("Step index cannot be negative.")
        return int(self.theta * step) % self.symbol_space

    def _normalize_resets(self, resets: Optional[Iterable[int]]) -> Set[int]:
        if resets is None:
            return set()
        return {int(idx) for idx in resets}

    def rotation_sequence(
        self, length: int, resets: Optional[Iterable[int]] = None
    ) -> List[int]:
        """Return the sequence of rotation keys applied to each position.

        The rotation list records the key *before* the corresponding symbol is
        processed. Resets restart the rotation at index ``0`` for that position.
        """

        if length < 0:
            raise ValueError("Length cannot be negative.")
        reset_points = self._normalize_resets(resets)
        rotation: List[int] = []
        segment_index = 0
        current_key = 0
        for i in range(length):
            if i in reset_points:
                segment_index = 0
                current_key = 0
            rotation.append(current_key)
            segment_index += 1
            current_key = self.rotation_key_for_step(segment_index)
        return rotation

    def decode_sequence(
        self,
        encoded: Sequence[int],
        resets: Optional[Iterable[int]] = None,
    ) -> List[int]:
        """Decode a sequence of integer symbol indices using the rotation cipher."""

        reset_points = self._normalize_resets(resets)
        decoded: List[int] = []
        segment_index = 0
        current_key = 0
        for i, value in enumerate(encoded):
            if i in reset_points:
                segment_index = 0
                current_key = 0
            decoded_value = (value - current_key) % self.symbol_space
            decoded.append(decoded_value)
            segment_index += 1
            current_key = self.rotation_key_for_step(segment_index)
        return decoded

    def encode_sequence(
        self,
        decoded: Sequence[int],
        resets: Optional[Iterable[int]] = None,
    ) -> List[int]:
        """Encode a sequence of symbol indices using the rotational cipher."""

        reset_points = self._normalize_resets(resets)
        encoded: List[int] = []
        segment_index = 0
        current_key = 0
        for i, value in enumerate(decoded):
            if i in reset_points:
                segment_index = 0
                current_key = 0
            encoded_value = (value + current_key) % self.symbol_space
            encoded.append(encoded_value)
            segment_index += 1
            current_key = self.rotation_key_for_step(segment_index)
        return encoded

    def decode_to_text(
        self,
        encoded: Sequence[int],
        alphabet: Sequence[str],
        resets: Optional[Iterable[int]] = None,
    ) -> str:
        """Return a decoded string using ``alphabet`` as the lookup table."""

        if len(alphabet) != self.symbol_space:
            raise ValueError(
                "Alphabet length must match the symbol space size ({}).".format(
                    self.symbol_space
                )
            )
        decoded_indices = self.decode_sequence(encoded, resets=resets)
        return "".join(alphabet[index] for index in decoded_indices)


def parse_symbol_stream(stream: str) -> List[int]:
    """Parse a whitespace separated stream of integers into a symbol list."""

    tokens = [token for token in stream.replace("\n", " ").split(" ") if token]
    if not tokens:
        return []
    try:
        return [int(token, 0) for token in tokens]
    except ValueError as exc:  # pragma: no cover - defensive programming
        raise ValueError("All tokens must be integers.") from exc


def _load_alphabet(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as handle:
        characters = [line.rstrip("\n") for line in handle]
    if any(len(entry) != 1 for entry in characters):
        raise ValueError("Alphabet file must contain one character per line.")
    return characters


def _parse_resets(argument: Optional[str]) -> Set[int]:
    if argument is None:
        return set()
    if not argument.strip():
        return set()
    return {int(part.strip()) for part in argument.split(",") if part.strip()}


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run a small CLI to experiment with the decoder from the shell."""

    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "path",
        help="Path to a text file containing whitespace separated integers. Use '-'"
        " to read from stdin.",
    )
    parser.add_argument(
        "--resets",
        help="Comma separated list of positions where the rotation resets.",
    )
    parser.add_argument(
        "--alphabet",
        help="Optional path to an alphabet file (one symbol per line) for decoding.",
    )
    parser.add_argument(
        "--encode",
        action="store_true",
        help="Encode the provided stream instead of decoding it.",
    )
    parser.add_argument(
        "--partition-states",
        type=int,
        default=256,
        help="Override the partition function state count (default: 256).",
    )
    parser.add_argument(
        "--life-constant",
        type=int,
        default=18,
        help="Override the life constant (default: 18).",
    )
    parser.add_argument(
        "--name-constant",
        type=int,
        default=26,
        help="Override the name constant (default: 26).",
    )

    args = parser.parse_args(argv)

    if args.path == "-":
        import sys

        payload = sys.stdin.read()
    else:
        with open(args.path, "r", encoding="utf-8") as handle:
            payload = handle.read()

    values = parse_symbol_stream(payload)
    resets = _parse_resets(args.resets)

    decoder = RohoncDecoder(
        partition_states=args.partition_states,
        life_constant=args.life_constant,
        name_constant=args.name_constant,
    )

    if args.encode:
        result = decoder.encode_sequence(values, resets=resets)
    else:
        result = decoder.decode_sequence(values, resets=resets)

    if args.alphabet and not args.encode:
        alphabet = _load_alphabet(args.alphabet)
        text = decoder.decode_to_text(values, alphabet, resets=resets)
        output = text
    else:
        output = " ".join(str(value) for value in result)

    print(output)
    return 0


if __name__ == "__main__":  # pragma: no cover - manual execution entry point
    raise SystemExit(main())
