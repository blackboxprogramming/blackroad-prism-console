"""Sequence packing utilities for efficient training."""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
from dataclasses import dataclass
from typing import Iterable, Iterator, List, MutableMapping, Optional

LOGGER = logging.getLogger(__name__)


@dataclass
class PackingConfig:
    max_tokens: int
    spillover_tolerance: float = 0.05
    eos_token_id: int = 2


def _load_texts(path: pathlib.Path) -> Iterator[MutableMapping[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def pack_sequences(records: Iterable[MutableMapping[str, object]], config: PackingConfig) -> Iterator[List[int]]:
    current: List[int] = []
    for record in records:
        tokens = record.get("token_ids")
        if not isinstance(tokens, list):
            raise ValueError("Each record must provide token_ids")
        if len(tokens) > config.max_tokens:
            LOGGER.debug("Truncating record %s to %s tokens", record.get("id"), config.max_tokens)
            tokens = tokens[: config.max_tokens]
        appended = current + tokens + [config.eos_token_id]
        if len(appended) > config.max_tokens:
            overflow = len(appended) - config.max_tokens
            allowed = int(config.max_tokens * config.spillover_tolerance)
            if overflow > allowed and current:
                yield current
                current = tokens + [config.eos_token_id]
            else:
                current = appended[: config.max_tokens]
        else:
            current = appended
    if current:
        yield current


def pack_file(input_path: pathlib.Path, output_path: pathlib.Path, config: PackingConfig) -> None:
    batches = pack_sequences(_load_texts(input_path), config)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        for packed in batches:
            handle.write(json.dumps({"tokens": packed}) + "\n")
    LOGGER.info("Wrote packed sequences to %s", output_path)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pack token sequences into training batches")
    parser.add_argument("input", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("max_tokens", type=int)
    parser.add_argument("--spill", type=float, default=0.05)
    parser.add_argument("--eos", type=int, default=2)
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    config = PackingConfig(max_tokens=args.max_tokens, spillover_tolerance=args.spill, eos_token_id=args.eos)
    pack_file(args.input, args.output, config)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
