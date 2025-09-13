from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

from tools import storage, metrics
from . import utils, okr


@dataclass
class Scorecard:
    period: str
    level: str
    owner: str
    objectives: List[dict]


def build(period: str, level: str, owner: str) -> Scorecard:
    objs, krs = okr._load(period)  # type: ignore
    objs_sel = [o for o in objs if o["level"] == level and o["owner"] == owner]
    for obj in objs_sel:
        obj["krs"] = [kr for kr in krs if kr["objective_id"] == obj["id"]]
    sc = Scorecard(period=period, level=level, owner=owner, objectives=objs_sel)
    out_dir = utils.ARTIFACTS / "scorecards" / period
    utils._ensure_dir(out_dir / "tmp")
    md_lines = [f"# {level.title()} Scorecard - {owner}", ""]
    for o in objs_sel:
        md_lines.append(f"## {o['text']}")
        for kr in o["krs"]:
            md_lines.append(f"- {kr['metric']}: {kr['current']}/{kr['target']} {kr['unit']}")
    storage.write(str(out_dir / f"{level}_{owner}.md"), "\n".join(md_lines))
    html = "<br>".join(md_lines)
    storage.write(str(out_dir / f"{level}_{owner}.html"), html)
    metrics.emit("scorecards_built")
    utils.validate_and_write("scorecards", {
        "period": period,
        "level": level,
        "owner": owner,
    })
    return sc
