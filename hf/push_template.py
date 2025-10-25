"""Helpers for publishing agent assets to Hugging Face Spaces."""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Mapping, MutableMapping, Tuple, Union

FilePayload = Union[str, bytes, Path]


def _normalise_payload(payload: FilePayload) -> Tuple[io.BytesIO | Path, bool]:
    """Return a file-like object ready for upload and whether it should be closed."""

    if isinstance(payload, Path):
        return payload, False
    if isinstance(payload, bytes):
        return io.BytesIO(payload), True
    if isinstance(payload, str):
        return io.BytesIO(payload.encode("utf-8")), True
    raise TypeError(f"Unsupported payload type: {type(payload)!r}")


def publish_space(
    repo_id: str,
    files: Mapping[str, FilePayload],
    *,
    token: str | None = None,
    space_sdk: str = "gradio",
    private: bool = False,
    commit_message: str = "Initial agent publish",
) -> MutableMapping[str, str]:
    """Create or update a Hugging Face Space with the provided files.

    Parameters
    ----------
    repo_id:
        The ``namespace/name`` identifier for the Space.
    files:
        Mapping of file names (within the Space repository) to content payloads.
    token:
        Personal access token with write permissions. Falls back to ``HF_TOKEN``
        environment variable.
    space_sdk:
        SDK to associate with the Space (for example ``gradio`` or ``streamlit``).
    private:
        Whether the Space should be private.
    commit_message:
        Commit message used for uploaded files.

    Returns
    -------
    MutableMapping[str, str]
        Metadata returned by the Hugging Face Hub client, including the Space URL.

    Raises
    ------
    RuntimeError
        If the ``huggingface_hub`` package is not installed or a token is missing.
    """

    token = token or os.getenv("HF_TOKEN")

    try:
        from huggingface_hub import HfApi
    except ImportError as exc:  # pragma: no cover - depends on optional dependency
        raise RuntimeError(
            "huggingface_hub is required to publish Spaces. Install it with "
            "`pip install huggingface_hub`."
        ) from exc

    if not token:
        raise RuntimeError(
            "A Hugging Face token is required. Pass `token` or export HF_TOKEN."
        )

    api = HfApi(token=token)
    space_info = api.create_repo(
        repo_id=repo_id,
        repo_type="space",
        exist_ok=True,
        private=private,
        space_sdk=space_sdk,
    )

    for filename, payload in files.items():
        fileobj, should_close = _normalise_payload(payload)
        try:
            api.upload_file(
                path_or_fileobj=fileobj,
                path_in_repo=filename,
                repo_id=repo_id,
                repo_type="space",
                commit_message=commit_message,
            )
        finally:
            if should_close and hasattr(fileobj, "close"):
                fileobj.close()

    return space_info


__all__ = ["publish_space"]
