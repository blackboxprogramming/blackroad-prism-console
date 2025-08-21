#!/usr/bin/env python3
"""Stub for AI docs generator."""
from __future__ import annotations

import argparse

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-diff", action="store_true", help="Use diff context")
    parser.parse_args()
    print("ai_docs stub")

if __name__ == "__main__":
    main()
