import os, subprocess, shlex, uuid, json, time
from pathlib import Path
from typing import List, Optional

AIHAWK_DIR = Path(os.environ.get("AIHAWK_DIR", "/opt/aih/aih"))
DATA_DIR   = Path(os.environ.get("JOB_APPLIER_DATA_DIR", "/data"))
LOG_DIR    = Path(os.environ.get("JOB_APPLIER_LOG_DIR", "/logs"))
RUN_CMD    = os.environ.get("AIHAWK_RUN_CMD", "").strip()
DRY_RUN_DF = os.environ.get("AIHAWK_DRY_RUN", "true").lower() == "true"

for p in (DATA_DIR, LOG_DIR):
    p.mkdir(parents=True, exist_ok=True)

def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")

def start_run(job_urls: List[str], resume_text: Optional[str], cover_template: Optional[str], dry_run: Optional[bool]) -> str:
    run_id = uuid.uuid4().hex[:12]
    run_dir = DATA_DIR / "runs" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Persist inputs
    (run_dir / "jobs.txt").write_text("\n".join(job_urls), encoding="utf-8")
    if resume_text:
        (run_dir / "resume.txt").write_text(resume_text, encoding="utf-8")
    if cover_template:
        (run_dir / "cover_template.txt").write_text(cover_template, encoding="utf-8")

    # Initial run.json
    state = {
        "id": run_id,
        "created_at": _ts(),
        "status": "queued",
        "dry_run": DRY_RUN_DF if dry_run is None else dry_run,
        "aih_path": str(AIHAWK_DIR),
    }
    (run_dir / "run.json").write_text(json.dumps(state, indent=2))
    (run_dir / "stdout.log").write_text("")
    (run_dir / "stderr.log").write_text("")
    return run_id

def mark(run_id: str, **patch):
    run_dir = DATA_DIR / "runs" / run_id
    meta = json.loads((run_dir / "run.json").read_text())
    meta.update(patch)
    (run_dir / "run.json").write_text(json.dumps(meta, indent=2))

def run_aihawk(run_id: str):
    run_dir = DATA_DIR / "runs" / run_id
    out_f = run_dir / "stdout.log"
    err_f = run_dir / "stderr.log"

    mark(run_id, status="running", started_at=_ts())

    # Compose command
    dry = json.loads((run_dir / "run.json").read_text()).get("dry_run", True)
    cmd = RUN_CMD
    if not cmd:
        # Safe default: simulate while wiring real CLI later
        out_f.write_text("[sim] AIHawk invocation not configured. Set AIHAWK_RUN_CMD env to call main.py with your preferred flags.\n")
        mark(run_id, status="completed", finished_at=_ts(), simulated=True)
        return

    # Expand simple placeholders if user provided them in env
    cmd = cmd.replace("{AIHAWK_DIR}", str(AIHAWK_DIR)).replace("{RUN_DIR}", str(run_dir)).replace("{DRY_RUN}", "true" if dry else "false")

    with open(out_f, "ab") as out, open(err_f, "ab") as err:
        out.write(f"[cmd] {cmd}\n".encode())
        try:
            proc = subprocess.Popen(shlex.split(cmd), cwd=str(AIHAWK_DIR), stdout=out, stderr=err)
            rc = proc.wait()
            mark(run_id, status="completed" if rc == 0 else "failed", finished_at=_ts(), return_code=rc)
        except Exception as e:
            err.write(f"[exception] {e}\n".encode())
            mark(run_id, status="failed", finished_at=_ts(), error=str(e))
