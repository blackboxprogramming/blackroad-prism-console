"""Lightweight I/O helpers for the universal simulation starter kit."""

from __future__ import annotations

from pathlib import Path
from typing import Optional, Union

import numpy as np

try:  # Optional dependency used when available.
    import trimesh
except Exception:  # pragma: no cover - trimesh is optional during tests.
    trimesh = None  # type: ignore[assignment]


PathLike = Union[str, Path]


def load_point_cloud_ply(path: PathLike) -> np.ndarray:
    """Load a point cloud stored in a ``.ply`` file.

    The helper will try to use :mod:`trimesh` when it is available, falling
    back to a tiny ASCII parser otherwise.  Only ``x``, ``y`` and ``z`` vertex
    properties are returned; all other data is ignored.

    Parameters
    ----------
    path:
        Path to the PLY file on disk.

    Returns
    -------
    :class:`numpy.ndarray`
        ``(N, 3)`` array containing XYZ vertex positions.

    Raises
    ------
    ValueError
        If the file cannot be interpreted as a point cloud.
    """

    file_path = Path(path)

    if trimesh is not None:
        try:
            return _load_point_cloud_with_trimesh(file_path)
        except Exception:
            # ``trimesh`` can fail on some ASCII/Binary variants.  Fall through
            # to the minimal parser which gives clearer error messages.
            pass

    return _load_point_cloud_ascii(file_path)


def load_npz_scalar_field(path: PathLike, key: Optional[str] = None) -> np.ndarray:
    """Load a scalar field stored in an ``.npz`` archive.

    Parameters
    ----------
    path:
        Archive created via :func:`numpy.savez` or :func:`numpy.savez_compressed`.
    key:
        Optional array name inside the archive.  When omitted the helper will
        select ``"scalar_field"`` when present, otherwise it expects the
        archive to contain a single array.

    Returns
    -------
    :class:`numpy.ndarray`
        Array converted to ``float32`` for downstream metrics.

    Raises
    ------
    KeyError
        When the requested key is missing from the archive.
    ValueError
        When ``key`` is omitted and the archive contains multiple arrays.
    """

    archive_path = Path(path)
    with np.load(archive_path) as data:
        if key is not None:
            array = data[key]
        elif "scalar_field" in data.files:
            array = data["scalar_field"]
        elif len(data.files) == 1:
            array = data[data.files[0]]
        else:  # pragma: no cover - defensive guard for unexpected inputs.
            raise ValueError(
                "Multiple arrays found in archive; please specify the `key` "
                "parameter explicitly."
            )

    return np.asarray(array, dtype=np.float32)


def load_npy(path: PathLike) -> np.ndarray:
    """Load an array stored via :func:`numpy.save`.

    The loader forces a materialised :class:`~numpy.ndarray` (instead of a
    ``memmap``) to keep behaviour consistent across environments.
    """

    array_path = Path(path)
    array = np.load(array_path, allow_pickle=False)
    return np.asarray(array)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _load_point_cloud_with_trimesh(path: Path) -> np.ndarray:
    """Attempt to read a point cloud using :mod:`trimesh`."""

    mesh = trimesh.load(path, process=False)  # type: ignore[call-arg]

    if isinstance(mesh, trimesh.Scene):  # type: ignore[attr-defined]
        if not mesh.geometry:  # pragma: no cover - extremely small scene case.
            raise ValueError("Scene does not contain any geometry")
        mesh = trimesh.util.concatenate(tuple(mesh.geometry.values()))

    # ``trimesh`` exposes point clouds either as ``Trimesh`` or ``PointCloud``.
    if hasattr(mesh, "vertices"):
        vertices = np.asarray(mesh.vertices, dtype=np.float32)
    elif hasattr(mesh, "points"):
        vertices = np.asarray(mesh.points, dtype=np.float32)
    else:  # pragma: no cover - unexpected trimesh type.
        raise ValueError(f"Unsupported trimesh object type: {type(mesh)!r}")

    if vertices.ndim != 2 or vertices.shape[1] < 3:
        raise ValueError("Point cloud must be an (N, 3) array of XYZ vertices")

    return vertices[:, :3]


def _load_point_cloud_ascii(path: Path) -> np.ndarray:
    """Parse an ASCII PLY point cloud without external dependencies."""

    with path.open("r", encoding="utf-8") as handle:
        header = _read_ply_header(handle)
        vertex_count = header["vertex_count"]
        vertex_columns = header["vertex_columns"]

        vertices: list[list[float]] = []
        for _ in range(vertex_count):
            line = handle.readline()
            if not line:
                raise ValueError("Unexpected end of file while reading vertices")
            parts = line.strip().split()
            if len(parts) < len(vertex_columns):
                raise ValueError("Vertex line does not provide enough columns")
            xyz = [float(parts[idx]) for idx in vertex_columns]
            vertices.append(xyz)

    if len(vertices) != vertex_count:
        raise ValueError(
            "Vertex count declared in header does not match file contents"
        )

    return np.asarray(vertices, dtype=np.float32)


def _read_ply_header(handle) -> dict:
    """Read the PLY header and return parsing metadata."""

    first_line = handle.readline().strip()
    if first_line != "ply":
        raise ValueError("File does not start with a valid PLY header")

    format_line = handle.readline().strip()
    if not format_line.startswith("format ascii"):
        raise ValueError("Only ASCII PLY files are supported without trimesh")

    vertex_count: Optional[int] = None
    vertex_columns: list[int] = []
    current_vertex_index = 0
    reading_vertex_props = False

    while True:
        line = handle.readline()
        if not line:
            raise ValueError("Unexpected end of header")
        stripped = line.strip()

        if stripped == "end_header":
            break
        if not stripped or stripped.startswith("comment"):
            continue

        tokens = stripped.split()
        keyword = tokens[0]

        if keyword == "element":
            reading_vertex_props = tokens[1] == "vertex"
            if reading_vertex_props:
                vertex_count = int(tokens[2])
                vertex_columns = []
                current_vertex_index = 0
            else:
                reading_vertex_props = False
        elif keyword == "property" and reading_vertex_props:
            # Only keep the first three vertex properties which we assume to be
            # XYZ.  Additional properties (normals, colours, etc.) are ignored.
            if current_vertex_index < 3:
                vertex_columns.append(current_vertex_index)
            current_vertex_index += 1
        else:
            continue

    if vertex_count is None:
        raise ValueError("PLY header does not declare a vertex element")
    if len(vertex_columns) < 3:
        raise ValueError("PLY file does not provide X/Y/Z vertex properties")

    return {"vertex_count": vertex_count, "vertex_columns": vertex_columns[:3]}


__all__ = [
    "load_point_cloud_ply",
    "load_npz_scalar_field",
    "load_npy",
]
