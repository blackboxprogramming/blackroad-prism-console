from __future__ import annotations

import re
from typing import Iterable, List

STOPWORDS = {
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "if",
    "in",
    "on",
    "at",
    "for",
    "of",
    "to",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
}

TOKEN_PATTERN = re.compile(r"[\w']+", re.UNICODE)


def tokenize(text: str) -> List[str]:
    tokens = [match.group(0).lower() for match in TOKEN_PATTERN.finditer(text)]
    return [token for token in tokens if token not in STOPWORDS]


def tokenize_iterable(texts: Iterable[str]) -> List[List[str]]:
    return [tokenize(text) for text in texts]
