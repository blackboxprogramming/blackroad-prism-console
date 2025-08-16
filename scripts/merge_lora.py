#!/usr/bin/env python3
"""Merge LoRA adapter into base model (placeholder)."""

import argparse
import json
import os


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="EleutherAI/pythia-1.4b")
    parser.add_argument("--lora", default="outputs/lucidia-core-lora")
    parser.add_argument("--out", default="models/merged/lucidia-neox-1.4b")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    config = {"merged_from": args.base_model, "lora_path": args.lora}
    with open(os.path.join(args.out, "config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"Merged model written to {args.out}")


if __name__ == "__main__":
    main()
