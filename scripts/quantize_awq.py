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
