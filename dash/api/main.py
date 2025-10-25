from __future__ import annotations

import datetime
import json
import re
from pathlib import Path

from fastapi import Body, FastAPI

PROMPT_DIR = Path("codex_prompts/prompts")
PROMPT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Mission Builder API")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")
    return slug.lower() or "mission"


@app.post("/prompts")
def queue_prompt(
    title: str = Body(...),
    body: str = Body(...),
    infer_agent: bool = Body(default=True),
):
    slug = _slugify(title)
    path = PROMPT_DIR / f"{slug}.yaml"
    path.write_text(body)
    return {"ok": True, "path": str(path), "infer_agent": infer_agent}


@app.post("/schedule")
def schedule_job(title: str = Body(...), hour: int = Body(...)):
    sched = Path("codex_prompts/schedule.json")
    now = datetime.datetime.now().isoformat()
    data = {"title": title, "hour": hour, "created": now}
    sched.write_text(json.dumps(data, indent=2))
    return {"ok": True, "next": f"will trigger {hour}:00 daily"}
