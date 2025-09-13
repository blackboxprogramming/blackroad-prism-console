from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Callable, Dict, Any, List
import json, os, time, uuid


@dataclass
class SagaStep:
    name: str
    run: Callable[[Dict[str, Any]], Dict[str, Any]]
    compensate: Callable[[Dict[str, Any]], Dict[str, Any]] | None


@dataclass
class SagaDef:
    name: str
    steps: List[SagaStep]


class SagaRuntime:
    """
    Minimal durable saga engine:
    - start(saga_name, ctx)
    - tick(saga_id) progresses steps; on failure switches to COMPENSATING
    - persists state to JSON file
    """
    def __init__(self, store_path: str = "./sagas.json"):
        self.store_path = store_path
        self.defs: Dict[str, SagaDef] = {}
        self.state: Dict[str, Any] = self._load()

    def register(self, saga_def: SagaDef):
        self.defs[saga_def.name] = saga_def

    def start(self, saga_name: str, ctx: Dict[str, Any]) -> str:
        sid = uuid.uuid4().hex
        self.state[sid] = {
            "id": sid,
            "name": saga_name,
            "ts": time.time(),
            "status": "PENDING",
            "step_index": 0,
            "comp_index": None,
            "ctx": ctx,
            "timeline": []
        }
        self._save()
        return sid

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.store_path):
            try:
                return json.load(open(self.store_path))
            except Exception:
                return {}
        return {}

    def _save(self):
        json.dump(self.state, open(self.store_path, "w"), indent=2)

    def tick(self, sid: str) -> Dict[str, Any]:
        s = self.state[sid]
        saga_def = self.defs[s["name"]]
        if s["status"] in ("COMPLETED", "FAILED"):
            return s

        if s["status"] in ("PENDING", "RUNNING"):
            s["status"] = "RUNNING"
            if s["step_index"] >= len(saga_def.steps):
                s["status"] = "COMPLETED"
                self._save()
                return s
            step = saga_def.steps[s["step_index"]]
            try:
                res = step.run(s["ctx"])
                s["timeline"].append({"step": step.name, "ok": True, "res": res})
                s["step_index"] += 1
            except Exception as e:
                s["timeline"].append({"step": step.name, "ok": False, "err": str(e)})
                s["status"] = "COMPENSATING"
                s["comp_index"] = s["step_index"] - 1
        elif s["status"] == "COMPENSATING":
            idx = s["comp_index"]
            if idx is None or idx < 0:
                s["status"] = "FAILED"
                self._save()
                return s
            step = saga_def.steps[idx]
            if step.compensate:
                try:
                    res = step.compensate(s["ctx"])
                    s["timeline"].append({"compensate": step.name, "ok": True, "res": res})
                except Exception as e:
                    s["timeline"].append({"compensate": step.name, "ok": False, "err": str(e)})
            s["comp_index"] = idx - 1
            if s["comp_index"] is None or s["comp_index"] < 0:
                s["status"] = "FAILED"
        self._save()
        return s
