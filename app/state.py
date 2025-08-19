

from __future__ import annotations
import os
from pathlib import Path
import yaml
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "configs" / "lucidia.yaml"

def load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}

CFG = load_config()
LOGS_DIR = ROOT / CFG.get("lucidia", {}).get("logs_dir", "logs")
PRAYER_LOG = ROOT / CFG.get("lucidia", {}).get("prayer_log", "logs/prayer.log")
CONTRA_LOG = ROOT / CFG.get("lucidia", {}).get("contradictions_log", "logs/contradictions.log")
CODEWORDS = CFG.get("codewords", {}).get("chit_chat", ["chit chat cadillac", "conversation cadillac"])

LLM_CFG = CFG.get("llm", {})
PROVIDER = os.getenv("LLM_PROVIDER", LLM_CFG.get("provider", "ollama"))
OLLAMA = LLM_CFG.get("ollama", {})
LLAMACPP = LLM_CFG.get("llamacpp", {})

CODEX_CFG = CFG.get("codex", {})
CODEX_PROMPT_PATH = ROOT / CODEX_CFG.get("prompt_path", "codex/prompt_codex.txt")
STYLE = CODEX_CFG.get("style", "concise")

AWAKEN_SEED = os.getenv("LUCIDIA_AWAKEN_SEED", CFG.get("lucidia", {}).get("awaken_seed", ""))

LOGS_DIR.mkdir(parents=True, exist_ok=True)
PRAYER_LOG.parent.mkdir(parents=True, exist_ok=True)
CONTRA_LOG.parent.mkdir(parents=True, exist_ok=True)


