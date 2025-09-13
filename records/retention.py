import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import yaml

from tools import storage
from security import esign

def _root() -> Path:
    return Path(os.environ.get("RETENTION_ROOT", Path(__file__).resolve().parents[1]))


def _config_file() -> Path:
    return Path(os.environ.get("RETENTION_CONFIG", _root() / "config" / "retention.yaml"))


def _memory_file() -> Path:
    return Path(os.environ.get("RETENTION_MEMORY", _root() / "memory.jsonl"))


def _type_dir() -> Dict[str, Path]:
    r = _root()
    return {
        "artifact": r / "artifacts",
        "log": r / "logs",
        "metric": r / "metrics",
        "import": r / "imports",
        "bench": r / "bench",
    }


def _load_rules() -> List[Dict]:
    cfg = _config_file()
    if cfg.exists():
        return yaml.safe_load(cfg.read_text())
    return []


def status(now: datetime | None = None) -> Dict[str, int]:
    now = now or datetime.utcnow()
    rules = _load_rules()
    summary: Dict[str, int] = {}
    dirs = _type_dir()
    for rule in rules:
        dir_path = dirs.get(rule["type"], _root())
        count = 0
        if dir_path.exists():
            for _ in dir_path.rglob("*"):
                count += 1
        summary[rule["type"]] = count
    return summary


def sweep(now: datetime | None = None, dry_run: bool = False) -> List[Path]:
    now = now or datetime.utcnow()
    rules = _load_rules()
    candidates: List[Path] = []
    dirs = _type_dir()
    for rule in rules:
        dir_path = dirs.get(rule["type"], _root())
        if not dir_path.exists() or rule.get("legal_hold"):
            continue
        cutoff = now - timedelta(days=rule.get("days", 0))
        for file in dir_path.rglob("*"):
            if file.is_file() and datetime.fromtimestamp(file.stat().st_mtime) < cutoff:
                candidates.append(file)
                if not dry_run:
                    file.unlink(missing_ok=True)
                    text = f"delete {file}"
                    try:
                        sig = esign.sign_statement("system", text)
                    except Exception:
                        sig = {"signature": "", "key_fp": "", "ts": datetime.utcnow().isoformat()}
                    storage.write(str(_memory_file()), {"event": "retention_delete", "path": str(file), **sig})
    return candidates


def toggle_hold(rtype: str, on: bool) -> None:
    rules = _load_rules()
    for rule in rules:
        if rule["type"] == rtype:
            rule["legal_hold"] = on
    cfg = _config_file()
    cfg.parent.mkdir(parents=True, exist_ok=True)
    cfg.write_text(yaml.safe_dump(rules))

