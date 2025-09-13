from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import List

from metrics import emit

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
INDEX_PATH = ARTIFACTS / "retrieval" / "index.json"


def _tokenize(text: str) -> List[str]:
    return re.findall(r"\w+", text.lower())


def build() -> dict:
    """Build a simple inverted index over artifact text files."""
    emit("retrieval_index_build")
    index: dict = defaultdict(list)
    sources = list(ARTIFACTS.glob("*.txt"))
    for path in sources:
        tokens = _tokenize(path.read_text(encoding="utf-8"))
        tf = Counter(tokens)
        for term, freq in tf.items():
            index[term].append({"path": str(path), "score": float(freq)})
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as fh:
        json.dump(index, fh)
    return index


def search(query: str, limit: int = 10) -> List[dict]:
    """Search the index for a query string."""
    emit("retrieval_search")
    if not INDEX_PATH.exists():
        return []
    index = json.loads(INDEX_PATH.read_text())
    scores = defaultdict(float)
    for term in _tokenize(query):
        for hit in index.get(term, []):
            scores[hit["path"]] += hit["score"]
    hits = sorted(scores.items(), key=lambda x: -x[1])[:limit]
    return [{"path": p, "score": s} for p, s in hits]

