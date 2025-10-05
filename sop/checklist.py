import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import yaml
from pydantic import BaseModel

from tools import storage
from security import esign

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = ROOT / "sop" / "templates"


def _artifact_base() -> Path:
    return Path(os.environ.get("SOP_ARTIFACTS_DIR", ROOT / "artifacts" / "sop"))


class Step(BaseModel):
    id: str
    text: str
    required: bool
    done: bool = False
    actor: Optional[str] = None
    done_at: Optional[str] = None


class Checklist(BaseModel):
    id: str
    name: str
    steps: List[Step]


def load_template(name: str) -> Checklist:
    path = TEMPLATE_DIR / f"{name}.yaml"
    data = yaml.safe_load(path.read_text())
    steps = [Step(**s) for s in data.get("steps", [])]
    return Checklist(id=data.get("id", name), name=name, steps=steps)


def save_checklist(cl: Checklist) -> None:
    base = _artifact_base()
    path = base / cl.name / "checklist.json"
    storage.write(str(path), cl.model_dump(mode="json"))


def load_checklist(name: str) -> Checklist:
    base = _artifact_base()
    path = base / name / "checklist.json"
    data = json.loads(storage.read(str(path)))
    return Checklist(**data)


def attest_step(step_id: str, actor: str, note: str) -> None:
    base = _artifact_base()
    for file in base.glob("*/checklist.json"):
        cl = load_checklist(file.parent.name)
        for step in cl.steps:
            if step.id == step_id:
                done_at = datetime.utcnow().isoformat()
                sig = esign.sign_statement(actor, note)
                step.done = True
                step.actor = actor
                step.done_at = done_at
                save_checklist(cl)
                storage.write(
                    str(file.parent / f"{step_id}.json"),
                    {"actor": actor, "note": note, "done_at": done_at, **sig},
                )
                return
    raise ValueError("step-not-found")


def remaining_required(name: str) -> List[Step]:
    cl = load_checklist(name)
    return [s for s in cl.steps if s.required and not s.done]

