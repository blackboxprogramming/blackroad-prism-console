#!/usr/bin/env python3
import argparse, os, json, time, sys, subprocess, regex as re
from pathlib import Path
from typing import Dict, Any, Iterable, List
import yaml
from tqdm import tqdm

# HumanEval local import (installed via -e third_party/human-eval)
from human_eval.data import read_problems  # type: ignore

from utils import load_prompt_template, ensure_dir, now_stamp
from backends import make_backend

def build_prompt(template: str, problem: Dict[str, Any]) -> str:
    # HumanEval problem has key 'prompt' which contains the stub + docstring.
    return template.format(prompt=problem["prompt"])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True, help="Path to YAML config")
    args = ap.parse_args()

    with open(args.config, "r") as f:
        cfg = yaml.safe_load(f)

    out_dir = Path(cfg["paths"]["output_dir"])
    ensure_dir(out_dir)

    # prepare backend
    backend = make_backend(cfg["backend"], cfg.get("backend_params", {}))

    # load prompt template
    template = load_prompt_template(Path(cfg["prompt"]["template_path"]))

    # load problems
    problems = read_problems()
    task_ids = list(problems.keys()) if cfg["sampling"]["tasks"] == "all" else cfg["sampling"]["tasks"]
    task_ids = sorted(task_ids, key=lambda s: int(s.split("/")[-1]))

    n_samples = int(cfg["sampling"]["n_samples_per_task"])

    samples_path = out_dir / "latest.samples.jsonl"
    with open(samples_path, "w") as out:
        for task_id in tqdm(task_ids, desc="Generating"):
            prob = problems[task_id]
            prompt = build_prompt(template, prob)
            ep = prob["entry_point"]

            for i in range(n_samples):
                text = backend.generate(
                    prompt=prompt,
                    max_tokens=cfg["backend_params"].get("max_tokens", 256),
                    temperature=cfg["backend_params"].get("temperature", 0.2),
                    top_p=cfg["backend_params"].get("top_p", 0.95),
                    stop=cfg["backend_params"].get("stop", []),
                    timeout_s=cfg["backend_params"].get("timeout_s", 60),
                )

                # sanitize: strip fences, ensure only code, and ensure the function body starts indented
                text = sanitize_completion(text, entry_point=ep)

                out.write(json.dumps({"task_id": task_id, "completion": text}) + "\n")
                out.flush()

    # Optionally trigger scoring here (or do it via Makefile)
    print(f"\n[ok] Wrote samples → {samples_path}")
    print("Run scoring:\n  evaluate_functional_correctness outputs/latest.samples.jsonl")

FENCE_RE = re.compile(r"^```[a-zA-Z0-9]*\s*|\s*```$", re.MULTILINE)

def sanitize_completion(s: str, entry_point: str) -> str:
    # Remove markdown fences / extraneous prose
    s = FENCE_RE.sub("", s).strip()

    # If the model mistakenly repeats "def <entry_point>", drop it and keep body only
    # Capture everything after the first newline following 'def entry_point(' line
    m = re.search(rf"(?m)^\s*def\s+{re.escape(entry_point)}\s*\(.*?\):\s*\n(.*)$", s, flags=re.DOTALL)
    if m:
        s = m.group(1).lstrip("\n")

    # Ensure it starts with an indentation block (4 spaces)
    if not s.startswith("    "):
        # Best-effort: indent each non-empty line by 4 spaces
        s = "\n".join(("    " + ln if ln.strip() else "") for ln in s.splitlines())

    # Stop at double blank line (common end for bodies)
    s = re.split(r"\n\s*\n\s*\n", s, maxsplit=1)[0].rstrip() + "\n"
    return s

if __name__ == "__main__":
    main()
