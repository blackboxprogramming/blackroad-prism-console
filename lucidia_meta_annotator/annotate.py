"""Core annotation engine."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List

from .tempattr import strip_temp_attrs, is_temp
from .io_generic import read_metadata, write_metadata
from .logging import log_event


class ContradictionError(RuntimeError):
    pass


def _apply_attributes(metadata: Dict[str, Any], attrs: List[Dict[str, Any]], strict: bool) -> List[str]:
    applied: List[str] = []
    for item in attrs:
        name = item["Name"]
        if item.get("Remove"):
            if name in metadata:
                del metadata[name]
                applied.append(f"remove:{name}")
            continue
        if strict and name in metadata and metadata[name] != item.get("Value"):
            raise ContradictionError(name)
        metadata[name] = item.get("Value")
        applied.append(f"set:{name}")
    return applied


def annotate_dataset(metadata: Dict[str, Any], config: Dict[str, Any], *, strict: bool = True, strip_temp: bool = True, audit_path: str | None = None) -> Dict[str, Any]:
    meta = read_metadata(metadata)
    applied = _apply_attributes(meta, config.get("Attributes", []), strict)
    if strip_temp:
        before = list(k for k in meta if is_temp(k))
        meta = strip_temp_attrs(meta)
    else:
        before = []
    if audit_path:
        log_event(audit_path, {
            "applied": applied,
            "removed_temp": before,
        })
    return write_metadata(meta, strip_temp=False)


def annotate_file(*, in_path: str, out_path: str, config: Dict[str, Any], format: str = "generic", strict: bool = True, strip_temp: bool = True, audit_path: str | None = None) -> Dict[str, Any]:
    if format != "generic":
        raise NotImplementedError("only generic format supported in this reference implementation")
    data = json.loads(Path(in_path).read_text())
    result = annotate_dataset(data, config, strict=strict, strip_temp=strip_temp, audit_path=audit_path)
    Path(out_path).write_text(json.dumps(result))
    return {"audit_path": audit_path}
