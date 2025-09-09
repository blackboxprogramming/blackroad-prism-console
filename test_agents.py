"""Test runner for all agents in the agents directory.

This script imports each agent module and runs its main block if present.
Reports pass/fail for each agent.
"""

import importlib.util
import subprocess
import sys
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parent / "agents"
SKIP_FILES = {"AGENTS.md", "__init__.py"}


def run_module_main(module_path):
    """Run the module as a script in a subprocess."""
    result = subprocess.run([sys.executable, module_path], capture_output=True)
    return result.returncode, result.stdout.decode(), result.stderr.decode()


def import_module(module_path):
    """Try to import a Python file as a module."""
    name = module_path.stem
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
        return True, ""
    except Exception as exc:
        return False, str(exc)


def test_agents():
    print("=== Agent Test Runner ===")
    results = []
    for file in AGENTS_DIR.iterdir():
        if not file.is_file() or not file.name.endswith(".py"):
            continue
        if file.name in SKIP_FILES:
            continue
        print(f"\nTesting agent: {file.name}")
        # First, try importing
        ok, err = import_module(file)
        if not ok:
            print(f"FAILED to import: {file.name} -- {err}")
            results.append((file.name, "import_failed"))
            continue
        # Then, run as script if main block exists
        with open(file, "r") as f:
            src = f.read()
        if 'if __name__ == "__main__"' in src:
            rc, out, err = run_module_main(str(file))
            if rc == 0:
                print(f"PASSED main execution: {file.name}")
                results.append((file.name, "pass"))
            else:
                print(f"FAILED main execution: {file.name}")
                print("stdout:", out)
                print("stderr:", err)
                results.append((file.name, "main_failed"))
        else:
            print(f"PASSED import only (no main): {file.name}")
            results.append((file.name, "pass"))
    print("\n=== Summary ===")
    for name, status in results:
        print(f"{name}: {status}")
    failed = [r for r in results if r[1] != "pass"]
    if failed:
        print(f"\n{len(failed)} agent(s) failed.")
        return 1
    print("\nAll agents passed.")
    return 0


if __name__ == "__main__":
    sys.exit(test_agents())
