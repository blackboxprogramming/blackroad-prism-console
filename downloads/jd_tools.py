"""Utility helpers for working with job descriptions inside Zapier Code steps."""

from __future__ import annotations

import html
import re
from typing import Iterable, List, Sequence

__all__ = [
    "clean_html",
    "detect_remote_policy",
    "scrape_salary",
    "keyword_echo",
]

_TAG_RE = re.compile(r"<[^>]+>")
_BREAK_RE = re.compile(r"<\s*(?:br|/p)\s*/?>", re.IGNORECASE)
_SPACE_RE = re.compile(r"\s+")

REMOTE_PATTERNS = [
    r"fully remote",
    r"100% remote",
    r"remote within the united states",
    r"remote within (?:mn|minnesota)",
    r"work from (?:anywhere|home)",
]
HYBRID_PATTERNS = [
    r"hybrid",
    r"in-office [\w\s]+days",
    r"\b[23]-?day in office",
]
ONSITE_PATTERNS = [
    r"on[- ]site",
    r"in office",
    r"relocat(?:e|ion) required",
]
STATE_PATTERN = re.compile(r"\b(?:minnesota|mn|united states|u\.?s\.?|usa)\b", re.IGNORECASE)

MONEY_RE = re.compile(
    r"\$?\s*(?P<amount>[\d,.]+)\s*(?P<modifier>k|K|m|M)?\s*(?P<period>per\s+\w+|hour|ann?ual|year|yr)?",
)
RANGE_RE = re.compile(
    r"\$?\s*(?P<low>[\d,.]+)\s*(?P<low_modifier>k|K|m|M|000)?\s*(?:-|to|–|—)\s*\$?\s*(?P<high>[\d,.]+)\s*(?P<high_modifier>k|K|m|M|000)?\s*(?P<period>per\s+\w+|hour|ann?ual|year|yr)?",
)


def clean_html(source: str) -> str:
    """Strip HTML tags, collapse whitespace, and unescape HTML entities."""

    if not source:
        return ""

    text = _BREAK_RE.sub("\n", source)
    text = _TAG_RE.sub(" ", text)
    text = html.unescape(text)
    text = _SPACE_RE.sub(" ", text)
    return text.strip()


def detect_remote_policy(source: str) -> dict:
    """Return heuristics about remote, hybrid, and onsite signals in the JD."""

    normalized = source.lower()
    remote_hits = _match_any(normalized, REMOTE_PATTERNS)
    hybrid_hits = _match_any(normalized, HYBRID_PATTERNS)
    onsite_hits = _match_any(normalized, ONSITE_PATTERNS)
    states = sorted({m.group(0).lower() for m in STATE_PATTERN.finditer(source)})
    policy = "remote" if remote_hits and not onsite_hits else "hybrid" if hybrid_hits else "onsite" if onsite_hits else "unspecified"

    return {
        "policy": policy,
        "remote_signals": remote_hits,
        "hybrid_signals": hybrid_hits,
        "onsite_signals": onsite_hits,
        "location_mentions": states,
    }


def scrape_salary(source: str) -> List[dict]:
    """Extract structured salary data from a JD."""

    salaries: List[dict] = []

    for match in RANGE_RE.finditer(source):
        low = _normalize_amount(match.group("low"), match.group("low_modifier"))
        high = _normalize_amount(match.group("high"), match.group("high_modifier"))
        period = _normalize_period(match.group("period"))
        salaries.append(
            {
                "type": "range",
                "raw": match.group(0).strip(),
                "min": low,
                "max": high,
                "period": period,
            }
        )

    if salaries:
        return salaries

    for match in MONEY_RE.finditer(source):
        amount = _normalize_amount(match.group("amount"), match.group("modifier"))
        period = _normalize_period(match.group("period"))
        salaries.append(
            {
                "type": "single",
                "raw": match.group(0).strip(),
                "value": amount,
                "period": period,
            }
        )

    return salaries


def keyword_echo(source: str, keywords: Sequence[str]) -> List[dict]:
    """Return occurrence counts and context snippets for each keyword."""

    results: List[dict] = []
    lower_source = source.lower()

    for keyword in keywords:
        if not keyword:
            continue
        pattern = re.escape(keyword.lower())
        matches = list(re.finditer(pattern, lower_source))
        snippets = [_extract_snippet(source, m.start(), m.end()) for m in matches]
        results.append(
            {
                "keyword": keyword,
                "count": len(matches),
                "snippets": snippets,
            }
        )

    return results


def _match_any(text: str, patterns: Iterable[str]) -> List[str]:
    hits: List[str] = []
    for pattern in patterns:
        if re.search(pattern, text):
            hits.append(pattern)
    return hits


def _normalize_amount(amount: str, modifier: str | None) -> float:
    value = float(amount.replace(",", ""))
    modifier = (modifier or "").lower()
    if modifier in {"k"}:
        value *= 1_000
    elif modifier in {"m"}:
        value *= 1_000_000
    elif modifier == "000":
        value *= 1_000
    return value


def _normalize_period(period: str | None) -> str:
    if not period:
        return "unspecified"
    period = period.lower().strip()
    if period.startswith("per "):
        return period.replace("per ", "")
    if period in {"year", "annual", "ann", "yr"}:
        return "year"
    if period == "hour":
        return "hour"
    return period


def _extract_snippet(text: str, start: int, end: int, window: int = 40) -> str:
    left = max(start - window, 0)
    right = min(end + window, len(text))
    snippet = text[left:right].strip()
    return snippet.replace("\n", " ")


if __name__ == "__main__":
    sample = "Salary: $95K-$120K per year. Role is fully remote within Minnesota and the United States."
    print(clean_html(sample))
    print(detect_remote_policy(sample))
    print(scrape_salary(sample))
    print(keyword_echo(sample, ["remote", "Minnesota"]))
