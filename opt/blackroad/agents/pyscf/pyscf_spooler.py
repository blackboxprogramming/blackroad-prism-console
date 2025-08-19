#!/usr/bin/env python3
import os, time, json, subprocess, sys, uuid, shutil

INBOX = "/var/lib/blackroad/queue/chem/inbox"
OUTBOX = "/var/lib/blackroad/queue/chem/outbox"
PROCESSED = "/var/lib/blackroad/queue/chem/processed"
FAILED = "/var/lib/blackroad/queue/chem/failed"
AGENT = "/opt/blackroad/agents/pyscf/pyscf_agent.py"
POLL_SEC = 0.5

def ensure_dirs():
    for d in (INBOX, OUTBOX, PROCESSED, FAILED):
        os.makedirs(d, exist_ok=True)

def claim(path: str) -> str | None:
    if not path.endswith(".json"): 
        return None
    working = path + ".working"
    try:
        os.rename(path, working)  # atomic claim
        return working
    except FileNotFoundError:
        return None
    except PermissionError:
        return None

def process_one(job_path: str):
    base = os.path.basename(job_path).replace(".working", "")
    out_path = os.path.join(OUTBOX, base.replace(".json", ".out.json"))
    try:
        p = subprocess.run(
            [sys.executable, AGENT, "--job", job_path],
            capture_output=True, text=True, timeout=None
        )
        stdout = p.stdout.strip()
        if p.returncode == 0:
            with open(out_path + ".tmp", "w") as f:
                f.write(stdout + "\n")
            os.replace(out_path + ".tmp", out_path)
            dest = os.path.join(PROCESSED, os.path.basename(job_path).replace(".working",""))
            os.replace(job_path, dest)
        else:
            fail_id = f"{uuid.uuid4()}"
            with open(os.path.join(FAILED, base + f".{fail_id}.err.txt"), "w") as f:
                f.write(stdout + "\n\nSTDERR:\n" + p.stderr)
            os.remove(job_path)
    except Exception as e:
        fail_id = f"{uuid.uuid4()}"
        with open(os.path.join(FAILED, base + f".{fail_id}.panic.txt"), "w") as f:
            f.write(str(e))
        try:
            os.remove(job_path)
        except Exception:
            pass

def loop():
    ensure_dirs()
    while True:
        for name in sorted(os.listdir(INBOX)):
            path = os.path.join(INBOX, name)
            w = claim(path)
            if not w:
                continue
            process_one(w)
        time.sleep(POLL_SEC)

if __name__ == "__main__":
    loop()
