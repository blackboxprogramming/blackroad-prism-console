#!/usr/bin/env python3
"""Stub for AI review tool."""
from __future__ import annotations

import argparse

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--diff", default="", help="Path to diff file")
    parser.parse_args()
    print("ai_review stub")

if __name__ == "__main__":
    main()
