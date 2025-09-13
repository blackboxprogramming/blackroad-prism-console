from pathlib import Path
import json
import argparse

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from cli import console

TARGETS = [
    "treasury_13w_cash",
    "revops_forecast_check",
    "sre_error_budget",
    "pricing_guardrails",
    "partner_enablement",
    "qa_defect_pareto",
    "finops_rightsizing",
    "iam_access_review",
]


def main():
    for name in TARGETS:
        console.cmd_cookbook(argparse.Namespace(name=name))
        src = Path("artifacts/cookbook") / f"{name}.json"
        dst = Path("tests/golden") / f"{name}.json"
        if src.exists():
            data = json.loads(src.read_text())
            dst.write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
