import argparse, pathlib, os
import argparse
import pathlib
import argparse
from pathlib import Path

import tools.llm as llm

SYSTEM = """You are Codex, writing high-value unit tests.
Rules:
- Table-driven tests; cover branches and error cases.
- No network/disk; mock external calls.
- Use existing test utils if referenced; keep tests fast.
- Output COMPLETE new test files as unified diffs or full paths with contents.
- Keep per-file patches minimal and focused on changed code.
"""

PROMPT = """Generate tests for the changed code below.
Aim for useful edge cases and negative tests. If the diff touches pure functions,
add property-like cases. If it touches I/O boundaries, add validator tests.

Context:

{ctx}

Output format:
- Prefer unified diff (`*** Begin Patch` / `*** End Patch`) OR
- For each new file:
  === FILE: <path> ===
  <contents>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--context", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    ctx = pathlib.Path(args.context).read_text()
    reply = llm.chat(PROMPT.format(ctx=ctx), SYSTEM)

    outdir = pathlib.Path(args.out)
    ctx = Path(args.context).read_text()
    reply = llm.chat(PROMPT.format(ctx=ctx), SYSTEM)

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    # Save raw AI output so it can be reviewed or parsed downstream
    (outdir / "AI_TESTS.out.md").write_text(reply)

    # Optional: naive splitter for "=== FILE: path ===" blocks
    chunks = []
    for block in reply.split("=== FILE: ")[1:]:
        path, rest = block.split(" ===", 1) if " ===" in block else block.split("\n", 1)
        chunks.append((path.strip(), rest.lstrip("\n")))
    for rel, body in chunks:
        path = outdir / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body)


if __name__ == "__main__":
    main()
