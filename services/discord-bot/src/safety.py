import re
from typing import List, Tuple


class Safety:
    """Minimal moderation helper for blocklist checks and PII redaction."""

    def __init__(self, blocklist: List[str], pii_patterns: List[str], action: str):
        # Compile patterns case-insensitively to catch mixed-case input
        self.blocklist = [re.compile(p, re.IGNORECASE) for p in blocklist]
        self.pii = [re.compile(p, re.IGNORECASE) for p in pii_patterns]
        self.action = action

    def scan(self, text: str) -> Tuple[bool, str, List[str]]:
        """Scan ``text`` and return ``(blocked, cleaned_text, hits)``."""

        hits = []
        for rx in self.blocklist:
            if rx.search(text):
                hits.append(rx.pattern)
        cleaned = text
        for rx in self.pii:
            cleaned = rx.sub("[REDACTED-PII]", cleaned)
        blocked = len(hits) > 0 and self.action == "hard"
        return blocked, cleaned, hits
