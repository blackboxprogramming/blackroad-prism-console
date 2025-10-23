import sys
import os
from pathlib import Path
import yaml

REQUIRED_FOLDERS = ["config", "logs", "docs"]


def _check_python() -> bool:
    ok = sys.version_info >= (3, 10)
    print(f"Python {sys.version.split()[0]}: {'OK' if ok else 'FAIL'}")
    return ok


def _check_folders() -> bool:
    ok = True
    for name in REQUIRED_FOLDERS:
        p = Path(name)
        if not p.exists():
            print(f"Missing folder: {name}")
            ok = False
    return ok


def _check_write() -> bool:
    try:
        Path("logs").mkdir(exist_ok=True)
        test_file = Path("logs/preflight.tmp")
        test_file.write_text("ok")
        test_file.unlink()
        print("Write permissions: OK")
        return True
    except Exception:
        print("Write permissions: FAIL")
        return False


def _check_encryption_key() -> bool:
    if os.environ.get("EAR_ENABLED") != "1":
        return True
    key = Path("config/ear_key.json")
    if key.exists():
        print("Encryption key: OK")
        return True
    print("Encryption key: MISSING")
    return False


def _check_dependencies() -> bool:
    req = Path("requirements.txt")
    if not req.exists():
        return True
    ok = True
    for line in req.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "==" not in line:
            print(f"Unpinned dependency: {line}")
            ok = False
    if ok:
        print("Dependencies: OK")
    return ok


def _check_configs() -> bool:
    ok = True
    for name in ["config/rbac.yml", "config/approvals.yml", "config/settings.yml"]:
        p = Path(name)
        if p.exists():
            try:
                yaml.safe_load(p.read_text())
            except yaml.YAMLError:
                print(f"Invalid config: {name}")
                ok = False
    return ok


def run_checks() -> bool:
    checks = [
        _check_python,
        _check_folders,
        _check_write,
        _check_encryption_key,
        _check_dependencies,
        _check_configs,
    ]
    results = [c() for c in checks]
    return all(results)


if __name__ == "__main__":
    sys.exit(0 if run_checks() else 1)
