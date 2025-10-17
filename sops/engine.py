"""SOP execution engine for BlackRoad.

This module provides loading and execution for Standard Operating Procedures
(SOPs). SOP definitions follow the EPA SOP format (title, purpose, scope,
procedure, quality_control).  Procedures are stored as YAML and may contain
multiple SOP definitions keyed by name.

The engine validates SOP structure, executes each step with basic logging and
produces immutable JSON records containing a SHA256 hash.  Records can be used
for audit trails and integration with broader compliance systems.

The implementation is intentionally lightweight; heavy integrations (Lucidia
memory, RoadView, RoadGlitch) are represented as stubs so the module can be
extended in future phases.
"""
from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

import yaml


log = logging.getLogger(__name__)


class SOPValidationError(Exception):
    """Raised when a SOP definition fails validation."""


@dataclass
class StepRecord:
    """Immutable record for a single SOP step."""

    timestamp: str
    sop: str
    step: str
    action: str
    hash: str

    def to_json(self) -> str:
        return json.dumps(self.__dict__, sort_keys=True)


class SOPEngine:
    """Loads, validates and executes SOPs."""

    required_fields = ["title", "purpose", "scope", "procedure", "quality_control"]

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or Path(__file__).resolve().parent
        self.records_dir = self.root / "records"
        self.records_dir.mkdir(exist_ok=True, parents=True)

    # ------------------------------------------------------------------ loaders
    def load(self, name: str) -> Dict[str, Any]:
        """Load a SOP by name from any YAML file under ``self.root``.

        The YAML files may contain multiple SOPs keyed by name.  ``name`` refers
        to the key of the desired SOP definition.
        """
        for path in self.root.glob("*.yaml"):
            data = yaml.safe_load(path.read_text()) or {}
            if name in data:
                sop = data[name]
                sop.setdefault("name", name)
                self.validate(sop)
                return sop
        raise FileNotFoundError(f"SOP '{name}' not found")

    # ------------------------------------------------------------------ validate
    def validate(self, sop: Dict[str, Any]) -> None:
        """Validate SOP structure against minimal EPA/ISO guidance."""
        for field in self.required_fields:
            value = sop.get(field)
            if not value:
                raise SOPValidationError(f"missing field: {field}")
        if not isinstance(sop["procedure"], list):
            raise SOPValidationError("procedure must be a list of steps")

    # ------------------------------------------------------------------ execution
    def run(self, name: str) -> Path:
        """Execute a SOP by name and return path to immutable record log."""
        sop = self.load(name)
        log.info("Running SOP %s", name)

        records: list[StepRecord] = []
        for step in sop["procedure"]:
            action = step.get("action", "")
            step_id = step.get("id") or action
            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "sop": name,
                "step": step_id,
                "action": action,
            }
            digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            record = StepRecord(**payload, hash=digest)
            records.append(record)
            # Placeholder: integrate with Lucidia memory / triggers
            self._notify_lucidia(record)

        run_id = uuid4().hex
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        output = self.records_dir / f"{name}-{timestamp}-{run_id}.json"
        output.write_text(json.dumps([json.loads(r.to_json()) for r in records], indent=2))
        return output

    # ------------------------------------------------------------------ stubs
    def _notify_lucidia(self, record: StepRecord) -> None:  # pragma: no cover - stub
        """Stub for Lucidia integration.

        Real implementation would push ``record`` into the Lucidia memory system
        and emit Breath/Spiral/Anchor alerts as appropriate.
        """
        pass


engine = SOPEngine()


if __name__ == "__main__":  # pragma: no cover - manual invocation
    import argparse

    parser = argparse.ArgumentParser(description="Run a SOP by name")
    parser.add_argument("name")
    args = parser.parse_args()
    path = engine.run(args.name)
    print(f"Record written to {path}")
