"""Dataset ingestion pipeline for BR-NOVA models.

This module orchestrates sourcing raw corpora, validating provenance, and
emitting manifest files that downstream stages consume.  It intentionally
avoids third-party model dependencies and uses deterministic hashing so that
Guardian can audit every artifact.
"""

from __future__ import annotations

import argparse
import dataclasses
import hashlib
import json
import logging
import pathlib
import shutil
import subprocess
import tarfile
import tempfile
from typing import Iterable, List, Mapping, MutableMapping, Optional

import yaml

LOGGER = logging.getLogger(__name__)


@dataclasses.dataclass
class SourceSpec:
    """Description of a single ingestible data source."""

    name: str
    path: pathlib.Path
    license: str
    tags: List[str]
    unpack: bool = False
    guardian_policy: Optional[str] = None

    @classmethod
    def from_mapping(cls, mapping: Mapping[str, object]) -> "SourceSpec":
        required = {"name", "path", "license", "tags"}
        missing = required - mapping.keys()
        if missing:
            raise ValueError(f"Missing fields for SourceSpec: {sorted(missing)}")
        return cls(
            name=str(mapping["name"]),
            path=pathlib.Path(mapping["path"]).expanduser().resolve(),
            license=str(mapping["license"]),
            tags=[str(tag) for tag in mapping["tags"]],
            unpack=bool(mapping.get("unpack", False)),
            guardian_policy=str(mapping["guardian_policy"]) if mapping.get("guardian_policy") else None,
        )


@dataclasses.dataclass
class ManifestEntry:
    """Metadata written to the manifest jsonl file."""

    name: str
    relative_path: str
    sha256: str
    num_bytes: int
    license: str
    tags: List[str]
    guardian_policy: Optional[str]

    def to_dict(self) -> MutableMapping[str, object]:
        return {
            "name": self.name,
            "relative_path": self.relative_path,
            "sha256": self.sha256,
            "num_bytes": self.num_bytes,
            "license": self.license,
            "tags": self.tags,
            "guardian_policy": self.guardian_policy,
        }


def _hash_file(path: pathlib.Path, chunk_size: int = 1 << 20) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _guardian_check(policy: Optional[str], path: pathlib.Path) -> None:
    """Invoke Guardian audit hooks when configured."""

    if not policy:
        LOGGER.debug("No Guardian policy configured for %s", path)
        return
    command = ["guardian-cli", "scan", str(path), "--policy", policy]
    LOGGER.info("Running Guardian policy %s for %s", policy, path)
    try:
        subprocess.run(command, check=True, capture_output=True)
    except FileNotFoundError:
        LOGGER.warning("Guardian CLI not available; recorded intent for %s", path)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Guardian policy {policy} failed for {path}") from exc


def _materialize_source(spec: SourceSpec, staging_dir: pathlib.Path) -> Iterable[pathlib.Path]:
    source_path = spec.path
    if not source_path.exists():
        raise FileNotFoundError(f"Source {source_path} missing for {spec.name}")

    if spec.unpack and tarfile.is_tarfile(source_path):
        LOGGER.info("Extracting %s", source_path)
        with tarfile.open(source_path) as archive:
            archive.extractall(staging_dir)
        yield from staging_dir.glob("**/*")
        return

    if spec.unpack and source_path.is_dir():
        LOGGER.info("Copying directory %s", source_path)
        destination = staging_dir / source_path.name
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(source_path, destination)
        yield from destination.glob("**/*")
        return

    if spec.unpack:
        raise ValueError(f"Unsupported archive type for {source_path}")

    destination = staging_dir / source_path.name
    shutil.copy2(source_path, destination)
    yield destination


def build_manifest(sources: Iterable[SourceSpec], output_path: pathlib.Path) -> List[ManifestEntry]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    entries: List[ManifestEntry] = []
    with tempfile.TemporaryDirectory() as staging:
        staging_dir = pathlib.Path(staging)
        for spec in sources:
            LOGGER.info("Processing source %s", spec.name)
            _guardian_check(spec.guardian_policy, spec.path)
            for artifact in _materialize_source(spec, staging_dir):
                if artifact.is_dir():
                    continue
                relative = artifact.relative_to(staging_dir)
                sha256 = _hash_file(artifact)
                entry = ManifestEntry(
                    name=f"{spec.name}:{relative.as_posix()}",
                    relative_path=str(relative),
                    sha256=sha256,
                    num_bytes=artifact.stat().st_size,
                    license=spec.license,
                    tags=spec.tags,
                    guardian_policy=spec.guardian_policy,
                )
                entries.append(entry)
                LOGGER.debug("Recorded %s (%s bytes)", entry.name, entry.num_bytes)
        with output_path.open("w", encoding="utf-8") as handle:
            for entry in entries:
                handle.write(json.dumps(entry.to_dict(), ensure_ascii=False) + "\n")
    LOGGER.info("Wrote %d manifest entries to %s", len(entries), output_path)
    return entries


def load_sources_from_yaml(config_path: pathlib.Path) -> List[SourceSpec]:
    with config_path.open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle)
    if not isinstance(payload, Mapping):
        raise ValueError("Ingest config must be a mapping")
    raw_sources = payload.get("sources", [])
    return [SourceSpec.from_mapping(mapping) for mapping in raw_sources]


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build dataset manifests for BR-NOVA")
    parser.add_argument("config", type=pathlib.Path, help="YAML file describing sources")
    parser.add_argument("output", type=pathlib.Path, help="Path to the manifest jsonl")
    parser.add_argument("--log-level", default="INFO", help="Logging level")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    sources = load_sources_from_yaml(args.config)
    build_manifest(sources, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
