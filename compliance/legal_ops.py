"""Legal operations helpers for automated governance.

The ``LegalOps`` class provides tiny helpers to generate simple
contracts and run placeholder regulatory checks.  The real platform
would integrate with dedicated compliance engines for SEC/FINRA/GAAP etc.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass
class Contract:
    parties: Dict[str, str]
    terms: str

    def render(self) -> str:
        party_lines = "\n".join(f"{role}: {name}" for role, name in self.parties.items())
        return f"Contract\n{party_lines}\n\nTerms:\n{self.terms}\n"


class LegalOps:
    """Very small contract and compliance utilities."""

    def generate_contract(self, parties: Dict[str, str], terms: str) -> Contract:
        return Contract(parties=parties, terms=terms)

    def sec_compliance_check(self, document: str) -> bool:
        """Placeholder check for SEC wording.

        The function simply ensures some basic disclosures are present.
        """

        required = ["risk", "forward-looking", "liability"]
        return all(word in document.lower() for word in required)
