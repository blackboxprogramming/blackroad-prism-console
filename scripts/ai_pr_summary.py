import argparse, tools.llm as llm, pathlib
import argparse
import pathlib
import argparse
from pathlib import Path

import tools.llm as llm

SYSTEM = "You are Codex, a senior staff engineer. Summarize PRs crisply and flag risks."
PROMPT_TMPL = """Summarize this pull request for reviewers. Include:
- What changed (plain English)
- Risk hot-spots (auth, data loss, migrations, PII, security)
- Suggested tests that should exist
- Breaking changes (if any)
Context:

{ctx}

"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--context", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    ctx = pathlib.Path(args.context).read_text()
    out = llm.chat(PROMPT_TMPL.format(ctx=ctx), SYSTEM)
    pathlib.Path(args.out).write_text(out)
    ctx = Path(args.context).read_text()
    out = llm.chat(PROMPT_TMPL.format(ctx=ctx), SYSTEM)
    Path(args.out).write_text(out)


if __name__ == "__main__":
    main()
