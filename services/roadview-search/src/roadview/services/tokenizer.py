from __future__ import annotations

import re
from typing import Iterable, List


_STOPWORDS = {
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "for",
    "on",
    "in",
    "with",
    "is",
    "are",
    "to",
    "of",
    "by",
    "at",
    "from",
    "as",
    "that",
    "this",
    "it",
    "be",
    "was",
    "were",
    "has",
    "had",
    "have",
}

_TOKEN_PATTERN = re.compile(r"[\w']+", re.UNICODE)


class Tokenizer:
    """Simple unicode-aware tokenizer with stop-word filtering."""

    def tokenize(self, text: str | None) -> List[str]:
        if not text:
            return []
        lowered = text.lower()
        tokens = [match.group() for match in _TOKEN_PATTERN.finditer(lowered)]
        normalized = [token.strip("_") for token in tokens if token.strip("_")]
        return [token for token in normalized if token not in _STOPWORDS]

    def term_frequency(self, tokens: Iterable[str]) -> dict[str, float]:
        counts: dict[str, int] = {}
        total = 0
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
            total += 1
        if total == 0:
            return {}
        return {term: freq / total for term, freq in counts.items()}
