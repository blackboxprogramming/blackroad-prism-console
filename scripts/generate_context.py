"""
Collects minimal repo context for AI: base..HEAD diff, touched files, and project contract.
"""
import os, subprocess, sys, pathlib

def sh(cmd: str) -> str:
    return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL).strip()

root = pathlib.Path(".").resolve()
base = os.getenv("GITHUB_BASE_REF", "main")
try:
    diff = sh(f"git diff --unified=0 {base}...HEAD || git diff --unified=0")
except Exception:
    diff = sh("git diff --unified=0")

touched = sh("git diff --name-only " + (base + "...HEAD" if base else "") + " || git diff --name-only")

contract = ""
p = root / "prompts" / "codex.project.md"
if p.exists():
    contract = p.read_text()

print("# Touched Files\n" + touched + "\n\n# Diff\n" + diff + "\n\n# Contract\n" + contract)
