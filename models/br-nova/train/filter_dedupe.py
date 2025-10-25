"""Filtering and deduplication utilities for BR-NOVA datasets."""

from __future__ import annotations

import argparse
import collections
import json
import logging
import math
import pathlib
from dataclasses import dataclass
from typing import Iterable, Iterator, List, MutableMapping, Optional, Sequence, Tuple

LOGGER = logging.getLogger(__name__)


@dataclass
class FilterConfig:
    min_length: int = 32
    max_length: int = 8192
    max_alnum_ratio: float = 0.98
    min_printable_ratio: float = 0.9
    dedupe_threshold: float = 0.85
    ngram_size: int = 13


def _load_records(path: pathlib.Path) -> Iterator[MutableMapping[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def _save_records(path: pathlib.Path, records: Iterable[MutableMapping[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def _alnum_ratio(text: str) -> float:
    if not text:
        return 0.0
    alnum = sum(ch.isalnum() for ch in text)
    return alnum / len(text)


def _printable_ratio(text: str) -> float:
    if not text:
        return 0.0
    printable = sum((31 < ord(ch) < 127) or ch in "\t\n" for ch in text)
    return printable / len(text)


def _tokenize_for_hash(text: str, ngram_size: int) -> List[int]:
    if len(text) < ngram_size:
        return [hash(text)]
    ngrams = (text[i : i + ngram_size] for i in range(len(text) - ngram_size + 1))
    return [hash(ngram) for ngram in ngrams]


def _jaccard(a: Sequence[int], b: Sequence[int]) -> float:
    set_a = set(a)
    set_b = set(b)
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union


@dataclass
class RecordSummary:
    record: MutableMapping[str, object]
    shingles: List[int]


def filter_and_dedupe(
    input_path: pathlib.Path,
    output_path: pathlib.Path,
    config: Optional[FilterConfig] = None,
) -> Tuple[int, int]:
    config = config or FilterConfig()
    retained: List[MutableMapping[str, object]] = []
    index: List[RecordSummary] = []

    for record in _load_records(input_path):
        text = str(record.get("text", ""))
        length = len(text)
        if length < config.min_length or length > config.max_length:
            continue
        if _alnum_ratio(text) > config.max_alnum_ratio:
            continue
        if _printable_ratio(text) < config.min_printable_ratio:
            continue

        shingles = _tokenize_for_hash(text, config.ngram_size)
        duplicate = False
        for prior in index:
            similarity = _jaccard(prior.shingles, shingles)
            if similarity >= config.dedupe_threshold:
                duplicate = True
                break
        if duplicate:
            continue

        record["filters"] = {
            "length": length,
            "alnum_ratio": round(_alnum_ratio(text), 4),
            "printable_ratio": round(_printable_ratio(text), 4),
        }
        retained.append(record)
        index.append(RecordSummary(record=record, shingles=shingles))

    _save_records(output_path, retained)
    LOGGER.info("Retained %s/%s records", len(retained), len(index))
    return len(retained), len(index)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Filter + dedupe jsonl corpora")
    parser.add_argument("input", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--config", type=pathlib.Path, help="Optional JSON config override")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def _load_config(path: Optional[pathlib.Path]) -> FilterConfig:
    if not path:
        return FilterConfig()
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return FilterConfig(**payload)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    config = _load_config(args.config)
    filter_and_dedupe(args.input, args.output, config=config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
