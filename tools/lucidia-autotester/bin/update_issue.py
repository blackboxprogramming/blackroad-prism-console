#!/usr/bin/env python3
"""Placeholder CLI for updating an issue."""

import json
import sys


def main() -> None:
    payload = json.load(sys.stdin)
    # TODO: implement GitHub issue update
    print(f"update_issue called with: {payload}")


if __name__ == "__main__":
    main()
