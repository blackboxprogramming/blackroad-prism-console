"""Helpers for building simple SBOM manifests."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
from pathlib import Path
from typing import Dict, Iterable, List


@dataclass
class SBOMComponent:
    """Description for a traced file within an artifact."""

    path: str
    digest: str
    size: int


@dataclass
class SBOM:
    """Aggregate manifest used by Sentinel attestations."""

    artifact: str
    components: List[SBOMComponent]

    def to_dict(self) -> Dict[str, object]:
        return {
            "artifact": self.artifact,
            "components": [asdict(component) for component in self.components],
        }


def _hash_file(path: Path) -> str:
    h = sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def _iter_component_files(path: Path) -> Iterable[Path]:
    if path.is_dir():
        for child in sorted(path.rglob("*")):
            if child.is_file():
                yield child
    elif path.is_file():
        yield path


def build(artifact_path: str) -> SBOM:
    """Build a simple SBOM for ``artifact_path``.

    Directories are enumerated recursively; missing artifacts produce an empty
    manifest so the caller can decide on the appropriate failure behaviour.
    """

    target = Path(artifact_path)
    components: List[SBOMComponent] = []
    if target.exists():
        for file_path in _iter_component_files(target):
            digest = _hash_file(file_path)
            components.append(
                SBOMComponent(
                    path=str(file_path.relative_to(target.parent if target.is_file() else target)),
                    digest=digest,
                    size=file_path.stat().st_size,
                )
            )
    return SBOM(artifact=str(target), components=components)
