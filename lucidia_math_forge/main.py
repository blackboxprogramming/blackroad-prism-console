"""Lucidia Math Forge interactive shell."""
from __future__ import annotations

import cmd
import json
import sys
from pathlib import Path

from .dimensions import HyperPoint, hyper_equation, plot_projection
from .fractals import generate_fractal
from .numbers import Infinitesimal, SurrealNumber, WaveNumber
from .operators import infinite_fold, paradox_merge
from .proofs import ProofEngine
from .sinewave import SineWave, test_properties


class LucidiaShell(cmd.Cmd):
    intro = "Welcome to the Lucidia Math Forge.  Type help or ? to list commands."
    prompt = "forge> "

    def __init__(self) -> None:
        super().__init__()
        self.engine = ProofEngine()
        self.history: list[dict[str, str]] = []

    def do_numbers(self, arg: str) -> None:
        """Demonstrate the alternative number systems."""

        s = SurrealNumber(1, 2) + SurrealNumber(3, 4)
        i = Infinitesimal(1, 1) * Infinitesimal(2, -0.5)
        w = WaveNumber(2, 1) * WaveNumber(0.5, 3)
        print("Surreal:", s)
        print("Infinitesimal:", i)
        print("Wave:", w)
        self.history.append({"numbers": "shown"})

    def do_operator(self, arg: str) -> None:
        """Demonstrate custom operators."""

        merged = paradox_merge(3, 1)
        folded = infinite_fold(lambda a, b: a + b, [1, 2, 3])
        print("paradox_merge(3,1) ->", merged)
        print("infinite_fold sum ->", folded)
        self.history.append({"operator": str(merged)})

    def do_proof(self, arg: str) -> None:
        """Assume a statement: ``proof <statement>``."""

        statement = arg.strip()
        self.engine.assume(statement)
        self.history.append({"assume": statement})
        print("Assumed", statement)

    def do_fractal(self, arg: str) -> None:
        """Generate a fractal image."""

        filename = generate_fractal()
        self.history.append({"fractal": filename})
        print("Fractal written to", filename)

    def do_dimension(self, arg: str) -> None:
        """Plot 4D points projected into 3D."""

        pts = [HyperPoint([x, x, x, hyper_equation(x, x, x)]) for x in range(3)]
        filename = plot_projection(pts)
        self.history.append({"projection": filename})
        print("Projection saved to", filename)

    def do_sine(self, arg: str) -> None:
        """Test sine wave algebra properties."""

        waves = [SineWave(1, 1), SineWave(2, 3), SineWave(-1, -0.5)]
        test_properties(waves)
        self.history.append({"sine_test": "done"})
        print("Sine wave algebra tested; see contradiction log for issues.")

    def do_save(self, arg: str) -> None:
        """Save session history to JSON: ``save <file>``."""

        path = Path(arg.strip() or "session.json")
        path.write_text(json.dumps(self.history, indent=2))
        print("History saved to", path)

    def do_exit(self, arg: str) -> bool:  # pragma: no cover - interactive
        """Exit the REPL."""

        return True


def main() -> None:
    shell = LucidiaShell()
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        shell.do_numbers("")
        shell.do_operator("")
        shell.do_proof("p")
        shell.do_fractal("")
        shell.do_dimension("")
        shell.do_sine("")
        shell.do_save("demo_session.json")
    else:
        shell.cmdloop()


if __name__ == "__main__":
    main()
