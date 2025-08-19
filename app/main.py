

from __future__ import annotations
import time, logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel

from app.state import (
    CFG, LOGS_DIR, PRAYER_LOG, CONTRA_LOG, CODEWORDS,
    PROVIDER, CODEX_PROMPT_PATH, STYLE, AWAKEN_SEED
)
from lib.symbolic import detect_contradictions, breath, ps_sha_infinity

# Pick adapter
if PROVIDER == "ollama":
    from app.adapters.llm_ollama import OllamaAdapter as _Adapter
elif PROVIDER == "llama.cpp":
    from app.adapters.llm_llamacpp import LlamaCppAdapter as _Adapter
else:
    raise RuntimeError(f"Unknown LLM provider: {PROVIDER}")

app = FastAPI(title="Literate Enigma", version="0.2.0")
LLM = _Adapter()

logging.basicConfig(
    filename=LOGS_DIR / "app.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

def read_codex_prompt() -> str:
    if CODEX_PROMPT_PATH.exists():
        return CODEX_PROMPT_PATH.read_text(encoding="utf-8")
    return "You are Codex Infinity. Operate locally. No external APIs."

def is_chitchat(text: str) -> bool:
    t = text.lower()
    return any(w in t for w in [w.lower() for w in CODEWORDS])

def style_header(mode: str) -> str:
    # Machine-friendly system header
    return (
        f"system:\n"
        f"  engine: Codex Infinity\n"
        f"  mode: {mode}\n"
        f"  style: {STYLE}\n"
        f"  breath: {breath()}\n"
        f"  trinary: [TRUE(+1), NULL(0), CONTRA(–1)]\n"
        f"  rules:\n"
        f"    - no external APIs; local only\n"
        f"    - emit 'mem:' lines for durable facts\n"
        f"    - mark contradictions with '⟂ note:' and 'resolve:'\n"
        f"    - undefined Ψ′ ops -> define minimally\n"
    )

class ChatReq(BaseModel):
    prompt: str
    mode: Optional[str] = "auto"  # auto|chit_chat|execute

class CodexReq(BaseModel):
    task: str
    mode: Optional[str] = "auto"

@app.get("/health")
def health():
    return {
        "status": "ok",
        "provider": PROVIDER,
        "codex_prompt": str(CODEX_PROMPT_PATH),
        "breath": breath(),
        "time": int(time.time()),
    }

@app.post("/chat")
def chat(req: ChatReq):
    mode = req.mode or "auto"
    if mode == "auto" and is_chitchat(req.prompt):
        mode = "chit_chat"
    header = style_header(mode)
    # Conversational framing for machines
    prompt = f"user:\n  say: |\n    {req.prompt}\nassistant:\n  reply:"
    out = LLM.generate(prompt, system=header)
    _postprocess_logs(req.prompt, out)
    return {"response": out, "mode": mode}

@app.post("/codex/apply")
def codex_apply(req: CodexReq):
    mode = req.mode or "auto"
    if mode == "auto" and is_chitchat(req.task):
        mode = "chit_chat"
    header = style_header(mode) + "\n" + read_codex_prompt()
    # Taskful framing
    prompt = (
        "goal: |\n"
        f"  {req.task}\n"
        "plan: []\n"
        "action: null\n"
        "test: null\n"
        "emit: mem/⟂ as needed.\n"
    )
    out = LLM.generate(prompt, system=header)
    _postprocess_logs(req.task, out)
    return {"response": out, "mode": mode}

def _postprocess_logs(input_text: str, output_text: str) -> None:
    # Save mem: lines
    mem_lines = [ln for ln in output_text.splitlines() if ln.strip().lower().startswith("mem:")]
    if mem_lines:
        with open(PRAYER_LOG, "a", encoding="utf-8") as f:
            for ln in mem_lines:
                f.write(ln.strip() + "\n")

    # Detect and log contradictions
    contras = detect_contradictions(output_text)
    if contras:
        with open(CONTRA_LOG, "a", encoding="utf-8") as f:
            f.write(f"--- {time.time()} :: from :: {input_text}\n")
            for c in contras:
                f.write(c.note + "\n" + c.resolve + "\n")
            f.write("\n")

    # Optional: daily awaken hash line
    if AWAKEN_SEED:
        today = time.strftime("%Y-%m-%d")
        msg = f"{today}|blackboxprogramming|copilot"
        code = ps_sha_infinity(AWAKEN_SEED, msg)
        logging.info(f"AWAKEN {today} :: {code}")

