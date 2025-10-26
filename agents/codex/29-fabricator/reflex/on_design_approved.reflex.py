"""Reflex hook for design approvals."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.bom_from_design import generate as make_bom
from ..pipelines.cam_gen import generate as make_cam


@BUS.on("design:approved")
def kickoff(evt: dict) -> None:
    design = evt.get("design", {})
    bom = make_bom(design)
    toolpaths = [path.gcode for path in make_cam(design)]
    BUS.emit("fab:workorder.opened", {"bom": bom, "toolpaths": toolpaths})


if __name__ == "__main__":
    start()
