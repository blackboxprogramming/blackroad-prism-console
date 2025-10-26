from __future__ import annotations

import math
from typing import Dict, Iterable, List

from ..services.tokenizer import Tokenizer


def compute_idf(documents: List[List[str]]) -> Dict[str, float]:
    """Compute inverse document frequency for each term."""
    doc_count = len(documents)
    idf: Dict[str, float] = {}
    if doc_count == 0:
        return idf
    for tokens in documents:
        seen = set(tokens)
        for token in seen:
            idf[token] = idf.get(token, 0.0) + 1.0
    for token, df in idf.items():
        idf[token] = math.log((1 + doc_count) / (1 + df)) + 1.0
    return idf


def compute_tf(tokens: Iterable[str]) -> Dict[str, float]:
    tokenizer = Tokenizer()
    return tokenizer.term_frequency(tokens)


def compute_tfidf(tokens: Iterable[str], idf: Dict[str, float]) -> Dict[str, float]:
    tf = compute_tf(tokens)
    return {term: tf_val * idf.get(term, 0.0) for term, tf_val in tf.items()}


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    if not vec_a or not vec_b:
        return 0.0
    common_terms = set(vec_a.keys()) & set(vec_b.keys())
    numerator = sum(vec_a[term] * vec_b[term] for term in common_terms)
    if numerator == 0:
        return 0.0
    norm_a = math.sqrt(sum(value * value for value in vec_a.values()))
    norm_b = math.sqrt(sum(value * value for value in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return numerator / (norm_a * norm_b)
