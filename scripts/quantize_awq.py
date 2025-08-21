from awq import AutoAWQForCausalLM
from transformers import AutoTokenizer
from pathlib import Path
import argparse

p = argparse.ArgumentParser()
p.add_argument("--src", default="models/merged/lucidia-neox-1.4b")
p.add_argument("--dst", default="models/merged/lucidia-neox-1.4b-awq")
p.add_argument("--bits", type=int, default=8)  # 8 -> W8A16
args = p.parse_args()

Path(args.dst).mkdir(parents=True, exist_ok=True)
tok = AutoTokenizer.from_pretrained(args.src, use_fast=True)
model = AutoAWQForCausalLM.from_pretrained(args.src, low_cpu_mem_usage=True)
model.quantize(tokenizer=tok, quant_config={"zero_point": False, "groupsize": 128, "bits": args.bits})
model.save_quantized(args.dst, safetensors=True)
tok.save_pretrained(args.dst)
print("Saved AWQ model to", args.dst)
#!/usr/bin/env python3
"""Placeholder for AWQ weight-only quantization."""

import argparse
import os


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="models/merged/lucidia-neox-1.4b")
    parser.add_argument("--out", default="models/merged/lucidia-neox-1.4b-awq")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "quantize.log"), "w", encoding="utf-8") as f:
        f.write("AWQ quantization placeholder\n")
    print(f"Quantized model written to {args.out}")


if __name__ == "__main__":
    main()
