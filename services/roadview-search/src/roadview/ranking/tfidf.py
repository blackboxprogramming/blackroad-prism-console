from __future__ import annotations

import math
from typing import Dict, Iterable, Sequence

from ..services.tokenizer import tokenize


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(vec_a.get(term, 0.0) * weight for term, weight in vec_b.items())
    norm_a = math.sqrt(sum(weight * weight for weight in vec_a.values()))
    norm_b = math.sqrt(sum(weight * weight for weight in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def build_idf(docs: Sequence[Sequence[str]]) -> Dict[str, float]:
    doc_count = len(docs)
    df: Dict[str, int] = {}
    for tokens in docs:
        for term in set(tokens):
            df[term] = df.get(term, 0) + 1
    return {term: math.log((doc_count + 1) / (freq + 1)) + 1 for term, freq in df.items()}


def tf(tokens: Iterable[str]) -> Dict[str, float]:
    counts: Dict[str, float] = {}
    total = 0.0
    for token in tokens:
        counts[token] = counts.get(token, 0.0) + 1.0
        total += 1.0
    if total == 0:
        return {}
    return {token: freq / total for token, freq in counts.items()}


def tfidf(tokens: Iterable[str], idf: Dict[str, float]) -> Dict[str, float]:
    tf_vector = tf(tokens)
    return {token: weight * idf.get(token, 0.0) for token, weight in tf_vector.items()}


def query_vector(query: str, idf: Dict[str, float]) -> Dict[str, float]:
    tokens = tokenize(query)
    return tfidf(tokens, idf)
