"""Audit utilities for Codex entry markdown files.

This script scans the ``codex/entries`` directory (or a user supplied
path) and prints a compact report of the entries that were discovered.
It also highlights duplicate IDs or fingerprints so that old records can
be tidied up when the automation pipeline notices inconsistencies.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional
import re

ENTRY_TITLE_RE = re.compile(r"^#\s*Codex\s+(?P<id>\d+)\s+—\s+(?P<title>.+)$")
FINGERPRINT_RE = re.compile(r"^\*\*Fingerprint:\*\*\s*`(?P<fingerprint>[a-f0-9]{32,})`")
TAGLINE_RE = re.compile(r"^\*\*Tagline:\*\*\s*(?P<tagline>.+)$")


@dataclass
class CodexEntry:
    """Metadata extracted from a Codex markdown file."""

    id: str
    title: str
    fingerprint: Optional[str]
    tagline: Optional[str]
    path: Path

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "fingerprint": self.fingerprint,
            "tagline": self.tagline,
            "path": str(self.path),
        }


class EntryParseError(RuntimeError):
    """Raised when a Codex entry cannot be parsed."""


def iter_entry_files(entries_dir: Path) -> Iterable[Path]:
    for path in sorted(entries_dir.glob("*.md")):
        if path.is_file():
            yield path


def parse_entry(path: Path) -> CodexEntry:
    entry_id: Optional[str] = None
    title: Optional[str] = None
    fingerprint: Optional[str] = None
    tagline: Optional[str] = None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if entry_id is None:
            match = ENTRY_TITLE_RE.match(line)
            if match:
                entry_id = match.group("id")
                title = match.group("title").strip()
                continue

        if fingerprint is None:
            match = FINGERPRINT_RE.match(line)
            if match:
                fingerprint = match.group("fingerprint")
                continue

        if tagline is None:
            match = TAGLINE_RE.match(line)
            if match:
                tagline = match.group("tagline").strip()
                continue

    if entry_id is None or title is None:
        raise EntryParseError(f"{path} is missing the '# Codex N — Title' header")

    return CodexEntry(
        id=entry_id,
        title=title,
        fingerprint=fingerprint,
        tagline=tagline,
        path=path,
    )


def load_entries(entries_dir: Path) -> List[CodexEntry]:
    entries: List[CodexEntry] = []
    for entry_path in iter_entry_files(entries_dir):
        try:
            entries.append(parse_entry(entry_path))
        except EntryParseError as exc:
            raise EntryParseError(f"Failed to parse {entry_path}: {exc}") from exc
    entries.sort(key=lambda entry: int(entry.id))
    return entries


def build_duplicates_report(entries: Iterable[CodexEntry]) -> dict:
    ids = Counter(entry.id for entry in entries)
    fingerprints = Counter(entry.fingerprint for entry in entries if entry.fingerprint)
    return {
        "duplicate_ids": sorted(id_ for id_, count in ids.items() if count > 1),
        "duplicate_fingerprints": sorted(fp for fp, count in fingerprints.items() if count > 1),
    }


def render_table(entries: Iterable[CodexEntry]) -> str:
    rows = [
        (entry.id, entry.title, (entry.fingerprint or "—")[:16], entry.tagline or "—")
        for entry in entries
    ]
    id_width = max((len(row[0]) for row in rows), default=2)
    title_width = max((len(row[1]) for row in rows), default=5)
    fingerprint_width = max((len(row[2]) for row in rows), default=11)
    tagline_width = max((len(row[3]) for row in rows), default=7)

    header = (
        f"{'ID'.ljust(id_width)}  "
        f"{'Title'.ljust(title_width)}  "
        f"{'Fingerprint'.ljust(fingerprint_width)}  "
        f"{'Tagline'.ljust(tagline_width)}"
    )
    separator = "-" * len(header)
    lines = [header, separator]
    for row in rows:
        lines.append(
            f"{row[0].ljust(id_width)}  "
            f"{row[1].ljust(title_width)}  "
            f"{row[2].ljust(fingerprint_width)}  "
            f"{row[3].ljust(tagline_width)}"
        )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit Codex entry files")
    parser.add_argument(
        "--entries-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "entries",
        help="Path to the directory containing Codex entry markdown files.",
    )
    parser.add_argument(
        "--format",
        choices=("table", "json"),
        default="table",
        help="Output format: a human friendly table or machine readable JSON.",
    )
    args = parser.parse_args()

    entries_dir = args.entries_dir
    if not entries_dir.exists() or not entries_dir.is_dir():
        raise SystemExit(f"Entries directory not found: {entries_dir}")

    entries = load_entries(entries_dir)
    duplicates = build_duplicates_report(entries)

    if args.format == "json":
        payload = {
            "entries": [entry.to_dict() for entry in entries],
            "duplicates": duplicates,
        }
        print(json.dumps(payload, indent=2))
    else:
        print(render_table(entries))
        if duplicates["duplicate_ids"] or duplicates["duplicate_fingerprints"]:
            print()
            print("Warnings:")
            if duplicates["duplicate_ids"]:
                print(f"  • Duplicate IDs: {', '.join(duplicates['duplicate_ids'])}")
            if duplicates["duplicate_fingerprints"]:
                print(
                    "  • Duplicate fingerprints: "
                    + ", ".join(duplicates["duplicate_fingerprints"])
                )


if __name__ == "__main__":
    main()
