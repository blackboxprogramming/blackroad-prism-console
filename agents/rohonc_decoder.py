"""Experimental decoder utilities for the Rohonc Codex.

This module provides a ``RohoncDecoder`` helper that mirrors the
"partition function" inspired workflow described by researchers who study
possible substitution systems in the Rohonc Codex.  The class is designed
so that experiments can be scripted without relying on notebooks or ad-hoc
scripts sprinkled throughout the repository.

The implementation is intentionally lightweight: it focuses on common tasks
like computing symbol frequencies, generating substitution mappings, and
running a rotational Caesar cipher whose step is derived from the parameters
``Z``, ``life``, and ``name``.  A small command line demonstration is
provided in ``main`` so contributors can see how the pieces fit together.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Iterable, List, MutableMapping, Sequence, Tuple


# Placeholder transcription of a few Rohonc Codex lines.  The characters do
# not map one-to-one to real glyphs; instead, they help exercise the decoder
# without having to digitise the full manuscript first.
IMAGE_1_SYMBOLS = """
Line 1: ∩ ⟨ ∧ ○ ⊃ ≈ ⊂ ∧ Δ ○ ∩ ⟨ ⟨ ⊂ ⊃ ≈
Line 2: ∩ ⊃ ≈ ⊂ ∧ ○ ⟨ ≈ ⟨ ○ ∩ ⟨ ⊃ ⟩ ≈ ⟨ ⊃
Line 3: ≈ ⟨ ∩ ∩ ⟨ ○ ∧ ⟨ ○ ∩ ≈ ○ ∧ ≈ ⟨ Δ
"""


@dataclass
class RohoncDecoder:
    """Implements the rotational substitution workflow for the codex."""

    z: int = 256
    life: int = 18
    name: int = 26
    target_frequencies: Sequence[str] = field(default_factory=list)
    symbol_to_num: MutableMapping[str, int] = field(default_factory=dict)
    num_to_symbol: MutableMapping[int, str] = field(default_factory=dict)
    theta: float = field(init=False)
    symbol_space: int = field(init=False)

    def __post_init__(self) -> None:
        total = self.z + self.life + self.name
        self.symbol_space = total // 2
        if self.symbol_space == 0:
            msg = "Symbol space must be non-zero."
            raise ValueError(msg)
        self.theta = self.z / self.symbol_space
        if not self.target_frequencies:
            self.target_frequencies = self._create_target_frequencies()

    # ------------------------------------------------------------------
    # Configuration helpers
    # ------------------------------------------------------------------
    def configuration_summary(self) -> str:
        """Return a human readable configuration summary."""

        total = self.z + self.life + self.name
        summary = (
            "Decoder configuration\n"
            f"  Partition (Z): {self.z}\n"
            f"  Life:          {self.life}\n"
            f"  Name:          {self.name}\n"
            f"  Total:         {total}\n"
            f"  Symbol space:  {self.symbol_space}\n"
            f"  Rotation θ:    {self.theta:.4f}\n"
        )
        return summary

    # ------------------------------------------------------------------
    # Data preparation
    # ------------------------------------------------------------------
    def extract_symbols(self, text_description: str) -> List[str]:
        """Extract a flat list of placeholder symbols from the description."""

        symbols: List[str] = []
        for line in text_description.splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            _, _, glyphs = line.partition(":")
            symbols.extend(token for token in glyphs.strip().split())
        return symbols

    def analyse_frequency(self, symbols: Sequence[str]) -> List[Tuple[str, int]]:
        """Return the frequency table sorted by most common first."""

        counts = Counter(symbols)
        return counts.most_common()

    def create_mapping(self, frequencies: Sequence[Tuple[str, int]]) -> None:
        """Map symbols to numbers and numbers to target characters."""

        self.symbol_to_num.clear()
        self.num_to_symbol.clear()

        for index, (symbol, _count) in enumerate(frequencies):
            if index >= len(self.target_frequencies):
                break
            target_char = self.target_frequencies[index]
            self.symbol_to_num[symbol] = index
            self.num_to_symbol[index] = target_char

    # ------------------------------------------------------------------
    # Decoding workflow
    # ------------------------------------------------------------------
    def decode_rotational_caesar(
        self,
        symbols: Sequence[str],
        sleep_markers: Iterable[str] | None = None,
    ) -> str:
        """Decode ``symbols`` using the rotational Caesar hypothesis."""

        if sleep_markers is None:
            sleep_markers = set()

        plaintext: List[str] = []
        k_value = 0
        position = 0

        for symbol in symbols:
            if symbol in sleep_markers:
                k_value = 0
                plaintext.append("\n")
                position = 0
                continue

            encoded_value = self.symbol_to_num.get(symbol)
            if encoded_value is None:
                plaintext.append("?")
                continue

            decoded_value = (encoded_value - k_value) % self.symbol_space
            decoded_char = self.num_to_symbol.get(decoded_value, "?")
            plaintext.append(decoded_char)

            position += 1
            k_value = int(self.theta * position) % self.symbol_space

        return "".join(plaintext)

    def validate_decoding(self, plaintext: str) -> bool:
        """Return ``True`` if the decoded text resembles natural language."""

        if not plaintext:
            return False

        common_terms = [
            "THE",
            "AND",
            "OF",
            "TO",
            "IN",
            "A",
            "IS",
            "THAT",
            "FOR",
            "IT",
            "ELOHIM",
            "YHWH",
            "BERESHIT",
            "VAYOMER",
            "ET",
        ]
        text_upper = plaintext.upper()
        return any(term in text_upper for term in common_terms)

    def test_multiple_rotations(
        self,
        symbols: Sequence[str],
        sleep_markers: Iterable[str] | None = None,
    ) -> Tuple[float, float, str]:
        """Return the best rotation ``θ`` and its score for the symbols."""

        candidates = [
            1.0,
            self.theta,
            1.618,
            2.0,
            3.141592,
            2.718281,
            7.0,
        ]

        best_theta = self.theta
        best_score = float("-inf")
        best_preview = ""

        for theta in candidates:
            self.theta = theta
            decoded_text = self.decode_rotational_caesar(symbols, sleep_markers)
            score = self._score_text(decoded_text)
            if score > best_score:
                best_theta = theta
                best_score = score
                best_preview = decoded_text[:200]

        self.theta = best_theta
        return best_theta, best_score, best_preview

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _create_target_frequencies(self) -> List[str]:
        """Construct the combined Hebrew, Latin, and Hungarian frequency list."""

        frequency_order = [
            # High frequency letters shared between languages
            "E",
            "A",
            "I",
            "O",
            "T",
            "N",
            "S",
            "R",
            "H",
            "L",
            # Medium frequency
            "D",
            "C",
            "U",
            "M",
            "W",
            "F",
            "G",
            "Y",
            "P",
            "B",
            # Hebrew specific additions
            "V",
            "K",
            "Z",
            # Less frequent Latin letters
            "J",
            "X",
            "Q",
        ]

        digits = list("0123456789")
        punctuation = list(".,!?:;- ")
        return frequency_order + digits + punctuation

    def _score_text(self, text: str) -> float:
        """Compute a heuristic score that rewards natural language signals."""

        if len(text) < 10:
            return 0.0

        score = 0.0
        alpha_ratio = sum(1 for char in text if char.isalpha()) / len(text)
        score += alpha_ratio

        for bigram in ("TH", "HE", "IN", "ER", "AN", "RE", "ON", "AT", "EN", "ND"):
            if bigram in text.upper():
                score += 0.1

        unique_ratio = len(set(text)) / max(len(text), 1)
        if unique_ratio < 0.1:
            score *= 0.5

        return score


def main() -> None:
    """Run a small decoding demonstration using placeholder symbols."""

    decoder = RohoncDecoder()
    print(decoder.configuration_summary())

    symbols = decoder.extract_symbols(IMAGE_1_SYMBOLS)
    if not symbols:
        print("No symbols extracted; please provide a transcription.")
        return

    frequencies = decoder.analyse_frequency(symbols)
    decoder.create_mapping(frequencies)

    decoded_text = decoder.decode_rotational_caesar(symbols)
    theta, score, preview = decoder.test_multiple_rotations(symbols)

    print("Decoded text (raw):")
    print(decoded_text)
    print()
    print(f"Best θ: {theta:.6f} with score {score:.4f}")
    print("Preview:")
    print(preview)

    if decoder.validate_decoding(decoded_text):
        print("Validation: text contains common terms.")
    else:
        print("Validation: no common terms detected; mapping may need tuning.")


if __name__ == "__main__":
    main()
