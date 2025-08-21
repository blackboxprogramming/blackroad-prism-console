#!/usr/bin/env python3
import os, subprocess, textwrap, shutil

MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")
DIFF_CMD = os.getenv("DIFF_CMD", "git diff --unified=0 origin/main...HEAD")

def run(cmd, inp=None):
    res = subprocess.run(cmd, input=inp, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        raise SystemExit(res.stderr.strip())
    return res.stdout

def chunk(s, n=12000):
    for i in range(0, len(s), n):
        yield s[i:i+n]

def review_chunk(d):
    prompt = f"""
You are a staff-level code reviewer. Review this unified diff and respond in Markdown with:
1) Summary (1-2 sentences)
2) Risk hotspots (file:line → why)
3) Missing/weak tests (exact cases)
4) Security/licensing concerns
5) Patch suggestions (small diffs/inline code)
DIFF:
{d}
"""
    if not shutil.which("ollama"):
        return "⚠️ Ollama not found; install Ollama or set OLLAMA_MODEL.\n"
    return run(f"ollama run {MODEL}", inp=prompt)

def main():
    diff = run(DIFF_CMD)
    if not diff.strip():
        print("No changes to review.")
        return
    outs = [review_chunk(c) for c in chunk(diff)]
    print("\n---\n".join(outs))

if __name__ == "__main__":
    main()
