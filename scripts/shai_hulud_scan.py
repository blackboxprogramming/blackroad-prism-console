#!/usr/bin/env python3
"""Scan lockfiles for packages compromised by the Shai-Hulud worm."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple


@dataclass(frozen=True)
class PackageMatch:
    name: str
    version: str
    lockfile: pathlib.Path
    source: str


class CompromisedRegistry:
    """Registry of compromised packages and their versions."""

    def __init__(self, table: Dict[str, Set[str]]):
        self._table = {name: set(versions) for name, versions in table.items()}

    @classmethod
    def from_file(cls, path: pathlib.Path) -> "CompromisedRegistry":
        with path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)

        packages = payload.get("packages")
        if not isinstance(packages, list):
            raise ValueError("JSON payload must contain a 'packages' list")

        table: Dict[str, Set[str]] = {}
        for entry in packages:
            if not isinstance(entry, dict):
                raise ValueError("Each package entry must be an object")
            name = entry.get("name")
            versions = entry.get("versions", ["*"])
            if not isinstance(name, str):
                raise ValueError("Package entries must include a string 'name'")
            if isinstance(versions, str):
                versions = [versions]
            if not isinstance(versions, Sequence) or not all(
                isinstance(v, str) for v in versions
            ):
                raise ValueError(
                    "Package entry 'versions' must be a string or list of strings"
                )
            table.setdefault(name, set()).update(versions)

        return cls(table)

    def is_compromised(self, name: str, version: str) -> bool:
        entries = self._table.get(name)
        if not entries:
            return False
        if "*" in entries:
            return True
        return version in entries

    def compromised_versions(self, name: str) -> Optional[Set[str]]:
        data = self._table.get(name)
        if data is None:
            return None
        return set(data)


def discover_lockfiles(start: pathlib.Path) -> List[pathlib.Path]:
    candidates: List[pathlib.Path] = []
    for filename in ("package-lock.json", "yarn.lock", "pnpm-lock.yaml"):
        target = start / filename
        if target.exists():
            candidates.append(target)
    return candidates


def parse_package_lock(path: pathlib.Path) -> Iterable[Tuple[str, str]]:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    packages = data.get("packages")
    if isinstance(packages, dict):
        for key, info in packages.items():
            if not isinstance(info, dict):
                continue
            version = info.get("version")
            name = info.get("name")
            if not name:
                name = _extract_name_from_package_lock_path(key)
            if name and isinstance(version, str):
                yield name, version

    dependencies = data.get("dependencies")
    if isinstance(dependencies, dict):
        for name, info in dependencies.items():
            if not isinstance(info, dict):
                continue
            version = info.get("version")
            if isinstance(name, str) and isinstance(version, str):
                yield name, version


def _extract_name_from_package_lock_path(path_key: str) -> Optional[str]:
    if not path_key:
        return None
    if path_key.startswith("node_modules/"):
        remainder = path_key[len("node_modules/") :]
        parts = remainder.split("node_modules/")
        # The actual package name is the last segment
        candidate = parts[-1]
        if candidate:
            return candidate
    return None


def parse_yarn_lock(path: pathlib.Path) -> Iterable[Tuple[str, str]]:
    with path.open("r", encoding="utf-8") as fh:
        current_specs: List[str] = []
        version: Optional[str] = None
        for raw_line in fh:
            line = raw_line.rstrip("\n")
            if not line.strip():
                current_specs = []
                version = None
                continue

            if not line.startswith("  ") and line.endswith(":"):
                entry = line.rstrip(":").strip().strip('"')
                specs = [spec.strip() for spec in entry.split(",") if spec.strip()]
                current_specs = specs
                version = None
                continue

            if line.strip().startswith("version"):
                match = re.match(
                    r"\s*version(?:\s*[:=])?\s+\"?(?P<version>[^\"\s]+)\"?",
                    line,
                )
                if match:
                    version = match.group("version")
                    for spec in current_specs:
                        name, _ = _split_spec(spec)
                        if name and version:
                            yield name, version
                continue


def _split_spec(spec: str) -> Tuple[Optional[str], Optional[str]]:
    if "@" not in spec:
        return spec or None, None
    if spec.startswith("@"):
        parts = spec.split("@")
        name = "@" + parts[1]
        version = "@".join(parts[2:]) if len(parts) > 2 else None
    else:
        name, version = spec.rsplit("@", 1)

    if name and "@npm:" in name:
        name = name.split("@npm:", 1)[0]

    return name or None, version or None


def parse_pnpm_lock(path: pathlib.Path) -> Iterable[Tuple[str, str]]:
    pattern = re.compile(r"^\s{2}/(?P<name>.+?)(?:/(?P<version>[^:/]+)|@(?P<ver2>[^:]+)):")
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            match = pattern.match(line)
            if not match:
                continue
            name = match.group("name")
            version = match.group("version") or match.group("ver2")
            if name and version:
                yield name, version


def scan_lockfile(path: pathlib.Path, registry: CompromisedRegistry) -> List[PackageMatch]:
    if path.name == "package-lock.json":
        iterator = parse_package_lock(path)
    elif path.name == "yarn.lock":
        iterator = parse_yarn_lock(path)
    elif path.name == "pnpm-lock.yaml":
        iterator = parse_pnpm_lock(path)
    else:
        raise ValueError(f"Unsupported lockfile: {path}")

    matches: List[PackageMatch] = []
    for name, version in iterator:
        if registry.is_compromised(name, version):
            versions = registry.compromised_versions(name)
            version_source = "all versions" if versions and "*" in versions else ", ".join(sorted(versions))
            matches.append(
                PackageMatch(
                    name=name,
                    version=version,
                    lockfile=path,
                    source=version_source,
                )
            )
    return matches


def run(paths: Sequence[pathlib.Path], registry: CompromisedRegistry) -> int:
    matches: List[PackageMatch] = []
    for path in paths:
        matches.extend(scan_lockfile(path, registry))

    if not matches:
        print("No compromised packages detected.")
        return 0

    print("Detected compromised packages:\n")
    for match in matches:
        print(f"- {match.name}@{match.version} (lockfile: {match.lockfile})")
        if match.source:
            print(f"  Compromised versions: {match.source}")
    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scan npm lockfiles for packages linked to the Shai-Hulud worm.",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=pathlib.Path,
        help="Specific lockfiles or directories to scan (defaults to current directory).",
    )
    parser.add_argument(
        "--registry",
        type=pathlib.Path,
        default=pathlib.Path("security/shai_hulud_compromised_packages.json"),
        help="Path to the compromised package registry JSON file.",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.paths:
        targets: List[pathlib.Path] = []
        for entry in args.paths:
            if entry.is_dir():
                targets.extend(discover_lockfiles(entry))
            else:
                targets.append(entry)
    else:
        targets = discover_lockfiles(pathlib.Path.cwd())

    if not targets:
        print("No lockfiles found. Specify explicit paths or run from a project root.")
        return 0

    try:
        registry = CompromisedRegistry.from_file(args.registry)
    except Exception as exc:  # pragma: no cover - defensive diagnostic
        parser.error(f"Unable to load registry: {exc}")

    exit_code = run(targets, registry)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
