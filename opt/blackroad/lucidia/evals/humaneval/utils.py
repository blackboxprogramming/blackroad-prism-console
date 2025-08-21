from pathlib import Path
import datetime

def load_prompt_template(path: Path) -> str:
    with open(path, "r") as f:
        return f.read()

def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)

def now_stamp() -> str:
    return datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
