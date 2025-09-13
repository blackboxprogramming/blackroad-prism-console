import json
from pathlib import Path
from typing import Dict, List

import yaml


def validate(packets_path: Path, levels_yaml: Path, pay_bands_yaml: Path) -> Dict[str, List[str]]:
    packets = json.loads(packets_path.read_text())
    levels = yaml.safe_load(levels_yaml.read_text())
    bands = yaml.safe_load(pay_bands_yaml.read_text())
    flags: Dict[str, List[str]] = {}
    for p in packets:
        lvl = p.get("level")
        band = bands.get(lvl)
        salary = p.get("salary")
        if band and salary and not (band["min"] <= salary <= band["max"]):
            flags.setdefault("CAL_OUT_OF_BAND", []).append(p["employee"])
        for comp, rating in p.get("ratings", {}).items():
            target = levels.get(lvl, {}).get(comp)
            if target and rating > target:
                flags.setdefault("CAL_DIST_DRIFT", []).append(p["employee"])
    return flags


def write_artifacts(out_dir: Path, flags: Dict[str, List[str]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "flags.json").write_text(json.dumps(flags, indent=2))
    lines = ["# Calibration Flags", ""]
    for code, people in flags.items():
        lines.append(f"- {code}: {', '.join(people)}")
    (out_dir / "slate.md").write_text("\n".join(lines))
