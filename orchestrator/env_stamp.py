import hashlib
import platform
from pathlib import Path
from typing import Dict

from tools import storage

from . import settings


def _hash_file(path: Path) -> str:
    try:
        data = path.read_bytes()
    except FileNotFoundError:
        return ""
    return hashlib.sha256(data).hexdigest()


def create_env_stamp(root: Path | None = None) -> str:
    """Create an environment stamp for reproducibility."""
    root = root or Path("artifacts")
    data: Dict[str, str | int] = {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "dependency_hash": _hash_file(Path("requirements.txt")),
        "settings_digest": hashlib.sha256(str(settings.RANDOM_SEED).encode()).hexdigest(),
        "random_seed": settings.RANDOM_SEED,
    }
    path = root / "env.json"
    storage.write(str(path), data)
    return str(path)
