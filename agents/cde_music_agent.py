"""Agent for generating melodies from notes C, D, and E."""

from dataclasses import dataclass
from typing import List, Sequence


@dataclass
class CDEMusicAgent:
    """Generate short melodies using notes C, D, and E.

    Attributes:
        notes: Sequence of note names to cycle through.
    """

    notes: Sequence[str] = ("C", "D", "E")

    def generate_melody(self, length: int) -> List[str]:
        """Return a melody of the requested length.

        Args:
            length: Number of notes to include. Must be positive.

        Returns:
            List of note names starting from C and cycling through ``notes``.
        """
        if length <= 0:
            raise ValueError("length must be positive")
        return [self.notes[i % len(self.notes)] for i in range(length)]


if __name__ == "__main__":
    agent = CDEMusicAgent()
    print(agent.generate_melody(8))
