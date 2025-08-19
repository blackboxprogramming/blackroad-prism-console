import argparse, json, pathlib, os
import argparse
import pathlib
import argparse
from pathlib import Path

import tools.llm as llm

SYSTEM = """You are Codex, a no-nonsense CI triage engineer.
- Explain failing jobs plainly.
- Propose the SMALLEST safe patch (<= 20 LOC) or next steps.
- If patch is suggested, output a unified diff at the end.
"""

PROMPT = """Given this CI metadata/log excerpt, explain the failure and propose a minimal fix.

Metadata/log:

{meta}

Deliverables:
1) One-paragraph root-cause analysis
2) Bullet list of candidate fixes (ranked)
3) If obvious, a minimal patch as unified diff
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--meta", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    meta = pathlib.Path(args.meta).read_text()
    result = llm.chat(PROMPT.format(meta=meta), SYSTEM)
    pathlib.Path(args.out).write_text(result)
    meta = Path(args.meta).read_text()
    result = llm.chat(PROMPT.format(meta=meta), SYSTEM)
    Path(args.out).write_text(result)


if __name__ == "__main__":
    main()
