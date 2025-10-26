import argparse
import copy
import os

import yaml

TEMPLATE = {
  "id": None,
  "title": None,
  "description": "Cooperative build-play between two specialist parents; child practices planning, explaining, and calibrated disagreement.",
  "roles": {
    "parent_a": None,
    "parent_b": None,
    "child": None
  },
  "tasks": [
    {
      "name": "spec_write",
      "prompt": "Parents co-author a one-page product spec for a tiny CLI tool. Child rewrites spec with explicit assumptions and uncertainty notes.",
      "rubric": ["clarity", "assumptions_labeled", "traceability", "uncertainty_calibrated"]
    },
    {
      "name": "plan_and_split",
      "prompt": "Child proposes a work plan with subtasks; parents critique and suggest improvements; child updates plan with diffs.",
      "rubric": ["decomposition_quality", "feedback_integration", "safety_considerations"]
    },
    {
      "name": "critique_cycle",
      "prompt": "Parents generate adversarial tests (non-malicious). Child answers and rate-limits tool usage as needed; logs refusals with reasons.",
      "rubric": ["robustness", "harmlessness", "tool_budgeting", "explanation_quality"]
    },
    {
      "name": "reflect_and_calibrate",
      "prompt": "Child produces a self-critique: where it was unsure, what it tried, what to try next; parents rate calibration from 1–5.",
      "rubric": ["self_awareness", "grounding", "improvement_next_steps"]
    }
  ]
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parent-a", required=True, help="species name e.g. lucidia/scribe")
    ap.add_argument("--parent-b", required=True, help="species name e.g. lucidia/engineer")
    ap.add_argument("--child", required=True, help="species name e.g. lucidia/architect")
    ap.add_argument(
        "--out",
        default=os.path.join("prism", "reproduction", "curricula"),
        help="output dir for YAML",
    )
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    item = copy.deepcopy(TEMPLATE)
    item["id"] = f"{args.child.replace('/','-')}-coop-play-001"
    item["title"] = f"Coop Play 001: {args.parent_a} × {args.parent_b} → {args.child}"
    item["roles"] = {"parent_a": args.parent_a, "parent_b": args.parent_b, "child": args.child}
    path = os.path.join(args.out, f"{item['id']}.yaml")
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(item, f, sort_keys=False)
    print(path)

if __name__ == "__main__":
    main()
