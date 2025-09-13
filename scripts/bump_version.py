#!/usr/bin/env python3
"""Bump the project version in pyproject.toml."""

import re
import subprocess  # noqa: F401 - imported for future use
import sys


def main() -> None:
    p = "pyproject.toml"
    level = sys.argv[1] if len(sys.argv) > 1 else "patch"  # major|minor|patch
    s = open(p).read()
    m = re.search(r"^version\s*=\s*\"(\d+)\.(\d+)\.(\d+)\"", s, re.M)
    if not m:
        print("version not found in pyproject.toml")
        sys.exit(1)
    maj, min_, pat = map(int, m.groups())
    if level == "major":
        maj, min_, pat = maj + 1, 0, 0
    elif level == "minor":
        min_, pat = min_ + 1, 0
    else:
        pat += 1
    nv = f"{maj}.{min_}.{pat}"
    ns = re.sub(
        r"(^version\s*=\s*\")\d+\.\d+\.\d+(\"$)",
        rf"\g<1>{nv}\g<2>",
        s,
        flags=re.M,
    )
    open(p, "w").write(ns)
    print("Bumped version ->", nv)
    print("Next steps:")
    print("  - Update CHANGELOG.md")
    print(
        f"  - git commit -am 'chore(release): v{nv}' && git tag v{nv} && git push --follow-tags"
    )


if __name__ == "__main__":
    main()

