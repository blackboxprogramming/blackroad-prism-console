"""Dispatch Codex prompt blueprints to OpenAI models and log outputs.

This utility reads YAML prompt definitions, routes them to their designated
agents/models, and stores the generated responses inside the ``codex_prompts``
folder.  It is designed to help orchestrate the Prism Console prompt series by
providing a repeatable workflow for running batches of prompts against Codex or
compatible models.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional

try:
    import yaml  # type: ignore
except ImportError as exc:  # pragma: no cover - dependency guard
    raise SystemExit(
        "PyYAML is required to run codex_prompt_dispatch.py. "
        "Install it with `pip install pyyaml` and retry."
    ) from exc


DEFAULT_OUTPUT_DIR = Path("codex_prompts") / "runs"
DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions"


@dataclass
class PromptJob:
    """Normalized prompt payload loaded from a YAML blueprint."""

    identifier: str
    prompt: str
    agent: str
    model: str
    temperature: float
    metadata: Dict[str, Any] = field(default_factory=dict)

    def system_message(self) -> str:
        base = self.metadata.get("system")
        if isinstance(base, str) and base.strip():
            return base
        return (
            "You are {agent}, a specialist Codex agent collaborating inside the "
            "Prism Console intelligence layer."
        ).format(agent=self.agent)


def _slugify(value: str) -> str:
    value_norm = unicodedata.normalize("NFKD", value)
    value_ascii = value_norm.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value_ascii).strip("-")
    slug = cleaned.lower() or "prompt"
    return slug


def _ensure_identifier(entry: Mapping[str, Any], fallback_index: int) -> str:
    for key in ("id", "identifier", "name", "title"):
        value = entry.get(key)
        if isinstance(value, str) and value.strip():
            return _slugify(value)
    return f"prompt-{fallback_index:02d}"


def _coerce_float(value: Any, default: float) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_blueprint(path: Path) -> tuple[List[PromptJob], Dict[str, Any]]:
    """Load prompt blueprint definitions from a YAML file."""

    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"Blueprint not found: {path}") from exc
    except yaml.YAMLError as exc:  # pragma: no cover - parsing errors
        raise SystemExit(f"Failed to parse YAML blueprint {path}: {exc}") from exc

    if raw is None:
        raise SystemExit(f"Blueprint {path} is empty.")

    if isinstance(raw, Mapping):
        defaults = raw.get("defaults", {}) if isinstance(raw.get("defaults"), Mapping) else {}
        entries = raw.get("prompts") or raw.get("agents") or raw.get("entries") or raw
        if isinstance(entries, Mapping):
            entries = list(entries.values())
    elif isinstance(raw, Iterable):
        defaults = {}
        entries = list(raw)
    else:
        raise SystemExit(f"Unsupported blueprint format in {path}.")

    if not isinstance(entries, list):
        raise SystemExit(f"Blueprint {path} does not contain a list of prompts.")

    default_model = defaults.get("model") if isinstance(defaults, Mapping) else None
    default_temperature = _coerce_float(defaults.get("temperature"), 0.2) if isinstance(defaults, Mapping) else 0.2

    jobs: List[PromptJob] = []
    for idx, entry in enumerate(entries, start=1):
        if not isinstance(entry, Mapping):
            raise SystemExit(
                f"Prompt entry #{idx} in {path} must be a mapping; received {type(entry)!r}."
            )

        prompt_text = entry.get("prompt")
        if not isinstance(prompt_text, str) or not prompt_text.strip():
            raise SystemExit(f"Prompt entry #{idx} in {path} is missing a 'prompt' string.")

        model = entry.get("model", default_model)
        if not isinstance(model, str) or not model.strip():
            raise SystemExit(
                f"Prompt entry #{idx} in {path} requires a 'model' (or blueprint default)."
            )

        agent = entry.get("target_agent") or entry.get("agent")
        if not isinstance(agent, str) or not agent.strip():
            agent = "Codex-Agent"

        identifier = _ensure_identifier(entry, idx)
        temperature = _coerce_float(entry.get("temperature"), default_temperature)
        metadata = {k: v for k, v in entry.items() if k not in {"prompt", "model", "temperature", "target_agent", "agent", "id", "identifier", "name", "title"}}

        jobs.append(
            PromptJob(
                identifier=identifier,
                prompt=prompt_text.strip(),
                agent=agent.strip(),
                model=model.strip(),
                temperature=temperature,
                metadata=metadata,
            )
        )

    return jobs, defaults if isinstance(defaults, Mapping) else {}


def _api_key_from_env(explicit: Optional[str]) -> str:
    if explicit:
        return explicit
    for key_name in ("OPENAI_API_KEY", "OPENAI_APIKEY", "BLACKROAD_OPENAI_KEY"):
        value = os.getenv(key_name)
        if value:
            return value
    raise SystemExit(
        "Missing API key. Provide --api-key or set OPENAI_API_KEY/OPENAI_APIKEY/BLACKROAD_OPENAI_KEY."
    )


def _dispatch_request(
    job: PromptJob,
    api_url: str,
    api_key: str,
    timeout: float,
    max_tokens: Optional[int],
    extra_headers: Optional[Mapping[str, str]],
    metadata: Mapping[str, Any],
    dry_run: bool,
) -> Dict[str, Any]:
    start = time.time()
    if dry_run:
        return {
            "status": "dry_run",
            "duration_seconds": 0.0,
            "message": "Dry run enabled; request not sent.",
        }

    payload: Dict[str, Any] = {
        "model": job.model,
        "temperature": job.temperature,
        "messages": [
            {"role": "system", "content": job.system_message()},
            {"role": "user", "content": job.prompt},
        ],
    }

    if max_tokens is not None:
        payload["max_tokens"] = int(max_tokens)

    if metadata:
        payload.setdefault("metadata", {}).update(metadata)

    request = urllib.request.Request(api_url)
    request.add_header("Content-Type", "application/json")
    request.add_header("Authorization", f"Bearer {api_key}")
    if extra_headers:
        for key, value in extra_headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, data=json.dumps(payload).encode("utf-8"), timeout=timeout) as response:
            body = response.read().decode("utf-8")
            duration = time.time() - start
            try:
                parsed = json.loads(body)
            except json.JSONDecodeError:
                parsed = {"raw": body}
            parsed.setdefault("status", "ok")
            parsed.setdefault("duration_seconds", duration)
            return parsed
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"API request failed with status {exc.code}: {error_body}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"API request failed: {exc}") from exc


def write_record(path: Path, record: Mapping[str, Any]) -> None:
    path.write_text(json.dumps(record, indent=2, sort_keys=True), encoding="utf-8")


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Dispatch Prism Console Codex prompts")
    parser.add_argument(
        "--blueprint",
        default=Path("codex_prompts") / "prism_console_math_layer.yaml",
        type=Path,
        help="Path to the YAML blueprint containing prompts.",
    )
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT_DIR,
        type=Path,
        help="Directory where prompt execution logs should be written.",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help="OpenAI-compatible endpoint to use for completions.",
    )
    parser.add_argument(
        "--api-key",
        help="Explicit API key (otherwise environment variables are used).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=120.0,
        help="HTTP timeout for each request in seconds.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        help="Optional limit for tokens in each completion response.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        help="Override sampling temperature for all prompts.",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Subset of prompt identifiers to execute (others are skipped).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="If set, the script will not call the API and will log placeholders instead.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.0,
        help="Optional delay in seconds between prompt executions.",
    )
    parser.add_argument(
        "--extra-header",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Additional HTTP headers to include when calling the API.",
    )
    parser.add_argument(
        "--metadata",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Extra metadata key=value pairs to attach to the request payload.",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    jobs, blueprint_defaults = load_blueprint(args.blueprint)

    if args.temperature is not None:
        for job in jobs:
            job.temperature = float(args.temperature)

    if args.only:
        wanted = {name.lower() for name in args.only}
        jobs = [job for job in jobs if job.identifier.lower() in wanted]
        if not jobs:
            print("No prompts matched the provided --only filter.", file=sys.stderr)
            return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    run_dir = args.output_dir / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    metadata_pairs: Dict[str, Any] = {}
    for item in args.metadata:
        if "=" not in item:
            raise SystemExit(f"Invalid --metadata entry '{item}'. Use KEY=VALUE format.")
        key, value = item.split("=", 1)
        metadata_pairs[key] = value

    extra_headers: Dict[str, str] = {}
    for header in args.extra_header:
        if "=" not in header:
            raise SystemExit(f"Invalid --extra-header entry '{header}'. Use KEY=VALUE format.")
        key, value = header.split("=", 1)
        extra_headers[key] = value

    summary: List[Dict[str, Any]] = []
    failures: List[str] = []

    api_key = None
    if not args.dry_run:
        api_key = _api_key_from_env(args.api_key)

    for index, job in enumerate(jobs, start=1):
        print(f"[{index}/{len(jobs)}] Dispatching prompt '{job.identifier}' to {job.agent} ({job.model})")
        try:
            response = _dispatch_request(
                job=job,
                api_url=args.api_url,
                api_key=api_key or "",  # safe: dry_run ensures key not required
                timeout=args.timeout,
                max_tokens=args.max_tokens,
                extra_headers=extra_headers,
                metadata=metadata_pairs,
                dry_run=args.dry_run,
            )
            record = {
                "id": job.identifier,
                "agent": job.agent,
                "model": job.model,
                "temperature": job.temperature,
                "prompt": job.prompt,
                "metadata": job.metadata,
                "response": response,
                "dispatched_at": dt.datetime.utcnow().isoformat() + "Z",
            }
            record_path = run_dir / f"{job.identifier}.json"
            write_record(record_path, record)
            summary.append({
                "id": job.identifier,
                "agent": job.agent,
                "model": job.model,
                "status": response.get("status", "ok"),
                "duration_seconds": response.get("duration_seconds"),
                "output_path": record_path.name,
            })
            if args.delay:
                time.sleep(args.delay)
        except Exception as exc:  # noqa: BLE001 - we want to capture unexpected failures
            error_message = str(exc)
            print(f"  ! Failed: {error_message}", file=sys.stderr)
            failures.append(f"{job.identifier}: {error_message}")
            summary.append({
                "id": job.identifier,
                "agent": job.agent,
                "model": job.model,
                "status": "error",
                "error": error_message,
            })

    summary_record = {
        "blueprint": str(args.blueprint),
        "run_started_at": timestamp,
        "prompt_count": len(jobs),
        "defaults": blueprint_defaults,
        "metadata": metadata_pairs,
        "dry_run": args.dry_run,
        "api_url": args.api_url,
        "results": summary,
        "failures": failures,
    }
    write_record(run_dir / "summary.json", summary_record)

    if failures:
        print(
            f"Completed with {len(failures)} failure(s). See {run_dir}/summary.json for details.",
            file=sys.stderr,
        )
        return 2

    print(f"All prompts completed successfully. Logs available in {run_dir}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
