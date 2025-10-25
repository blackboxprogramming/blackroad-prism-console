#!/usr/bin/env python3
"""CLI and lightweight API for spawning Codex agents with lineage tracking."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import logging
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "registry" / "lineage.json"
TEMPLATE_PATH = ROOT / "configs" / "agent_templates" / "config_template.yaml"
CONFIG_DIR = ROOT / "configs" / "agents"
ASSET_DIR = ROOT / "registry" / "agents"


def _load_registry(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _save_registry(path: Path, data: Iterable[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(list(data), handle, indent=2)
        handle.write("\n")


def _load_template(path: Path) -> Dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore
    except ImportError:  # pragma: no cover - optional dependency
        yaml = None

    if yaml is not None:
        loaded = yaml.safe_load(text)
    else:
        loaded = json.loads(text)

    if not isinstance(loaded, dict):
        raise ValueError("Agent template must resolve to a mapping")
    return loaded


def _dump_yaml(path: Path, data: Mapping[str, Any]) -> None:
    try:
        import yaml  # type: ignore
    except ImportError:  # pragma: no cover - optional dependency
        yaml = None

    path.parent.mkdir(parents=True, exist_ok=True)
    if yaml is not None:
        with path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
    else:
        with path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2)
            handle.write("\n")


def _slugify(value: str) -> str:
    safe = "".join(ch if ch.isalnum() else "-" for ch in value.lower())
    while "--" in safe:
        safe = safe.replace("--", "-")
    return safe.strip("-")


def _unique(sequence: Iterable[str]) -> List[str]:
    seen: Dict[str, None] = {}
    for item in sequence:
        if not item:
            continue
        key = item.strip()
        if not key:
            continue
        seen[key] = None
    return list(seen.keys())


def _build_readme(payload: Mapping[str, Any], huggingface_url: str) -> str:
    traits = payload.get("traits", [])
    traits_line = ", ".join(traits) if traits else "None"
    return (
        f"# {payload['name']} Agent Profile\n\n"
        f"- **Model**: {payload['model']}\n"
        f"- **Temperament**: {payload.get('temperament', 'n/a')}\n"
        f"- **Domain**: {payload.get('domain', 'n/a')}\n"
        f"- **Traits**: {traits_line}\n"
        f"- **Hugging Face Space**: {huggingface_url}\n\n"
        f"{payload.get('description', '').strip()}\n"
    ).strip() + "\n"


def _build_model_card(payload: Mapping[str, Any], base_model: str) -> str:
    tags = payload.get("traits", []) or [payload["name"].lower()]
    joined_tags = "\n  - ".join(tags)
    return (
        "---\n"
        f"license: {payload.get('huggingface', {}).get('license', 'apache-2.0')}\n"
        f"base_model: {base_model}\n"
        "language:\n  - en\n"
        "library_name: transformers\n"
        f"tags:\n  - {joined_tags}\n"
        "---\n\n"
        f"# {payload['name']} Model Card\n\n"
        f"{payload.get('description', '').strip()}\n"
    ).strip() + "\n"


def _resolve_parent(
    registry: Iterable[Mapping[str, Any]], parent_name: Optional[str]
) -> Optional[Mapping[str, Any]]:
    if not parent_name:
        return None
    for entry in registry:
        if entry.get("name") == parent_name or entry.get("uuid") == parent_name:
            return entry
    raise ValueError(f"Parent agent '{parent_name}' not found in registry")


def _create_entry(
    *,
    template: Mapping[str, Any],
    agent_uuid: str,
    name: str,
    base_model: str,
    description: str,
    domain: str,
    temperament: str,
    traits: Iterable[str],
    parent_entry: Optional[Mapping[str, Any]],
    namespace: str,
    repo_name: str,
) -> Dict[str, Any]:
    created_at = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    huggingface_space = f"{namespace}/{repo_name}"
    huggingface_url = f"https://huggingface.co/{huggingface_space}"

    merged_traits: List[str] = []
    if parent_entry:
        merged_traits.extend(parent_entry.get("traits", []))
    merged_traits.extend(traits)

    entry: Dict[str, Any] = {
        "uuid": agent_uuid,
        "name": name,
        "parent": parent_entry.get("uuid") if parent_entry else None,
        "model": base_model,
        "domain": domain,
        "temperament": temperament,
        "description": description,
        "traits": _unique(merged_traits),
        "huggingface_url": huggingface_url,
        "config_path": str(CONFIG_DIR / f"{_slugify(name)}.yaml"),
        "readme_path": str(ASSET_DIR / _slugify(name) / "README.md"),
        "model_card_path": str(ASSET_DIR / _slugify(name) / "MODEL_CARD.md"),
        "created_at": created_at,
    }

    template_payload = json.loads(json.dumps(template))
    template_payload.update(
        name=name,
        uuid=agent_uuid,
        model=base_model,
        description=description,
        domain=domain,
        temperament=temperament,
        traits=entry["traits"],
    )
    template_payload.setdefault("context", {})
    template_payload["context"].update(
        parent=entry["parent"],
        created_at=created_at,
    )
    template_payload.setdefault("huggingface", {})
    template_payload["huggingface"].update(space=huggingface_space)

    return entry, template_payload


def spawn_agent(
    *,
    name: str,
    base_model: str,
    description: str,
    domain: str,
    temperament: str,
    traits: Iterable[str],
    parent: Optional[str] = None,
    namespace: Optional[str] = None,
    repo_name: Optional[str] = None,
    publish: bool = True,
    dry_run: bool = False,
    space_sdk: str = "gradio",
    private_space: bool = False,
    token: Optional[str] = None,
) -> Dict[str, Any]:
    """Spawn an agent and optionally publish it to a Hugging Face Space."""

    registry = _load_registry(REGISTRY_PATH)
    if any(entry.get("name") == name for entry in registry):
        raise ValueError(f"Agent named '{name}' already exists")

    parent_entry = _resolve_parent(registry, parent)

    slug = _slugify(name)
    namespace = namespace or f"{slug}-ai"
    repo_name = repo_name or _slugify(domain) or slug

    template = _load_template(TEMPLATE_PATH)
    agent_uuid = template.get("uuid")
    if not agent_uuid:
        agent_uuid = slug + "-" + dt.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        template["uuid"] = agent_uuid

    agent_uuid = str(uuid.uuid4())
    entry, payload = _create_entry(
        template=template,
        agent_uuid=agent_uuid,
        name=name,
        base_model=base_model,
        description=description,
        domain=domain,
        temperament=temperament,
        traits=traits,
        parent_entry=parent_entry,
        namespace=namespace,
        repo_name=repo_name,
    )

    config_path = CONFIG_DIR / f"{slug}.yaml"
    agent_dir = ASSET_DIR / slug
    readme_path = agent_dir / "README.md"
    model_card_path = agent_dir / "MODEL_CARD.md"

    readme_content = _build_readme(payload, entry["huggingface_url"])
    model_card_content = _build_model_card(payload, base_model)

    result: Dict[str, Any] = {
        "entry": entry,
        "config_path": str(config_path),
        "readme_path": str(readme_path),
        "model_card_path": str(model_card_path),
        "huggingface_repo": f"{namespace}/{repo_name}",
        "files_written": [],
        "published": False,
        "errors": {},
    }

    if not dry_run:
        _dump_yaml(config_path, payload)
        agent_dir.mkdir(parents=True, exist_ok=True)
        readme_path.write_text(readme_content, encoding="utf-8")
        model_card_path.write_text(model_card_content, encoding="utf-8")

        registry.append(entry)
        _save_registry(REGISTRY_PATH, registry)
        result["files_written"].extend(
            [str(config_path), str(readme_path), str(model_card_path), str(REGISTRY_PATH)]
        )

        if publish:
            files_to_publish: Dict[str, str] = {
                "README.md": readme_content,
                "MODEL_CARD.md": model_card_content,
                "config.yaml": json.dumps(payload, indent=2),
            }
            try:
                from hf import publish_space

                publish_space(
                    result["huggingface_repo"],
                    files_to_publish,
                    token=token,
                    space_sdk=space_sdk,
                    private=private_space,
                    commit_message=f"Register agent {name}",
                )
                result["published"] = True
            except RuntimeError as exc:
                logging.warning("Skipping Hugging Face publish: %s", exc)
                result["errors"]["huggingface"] = str(exc)
    else:
        result["files_written"].extend(
            [str(config_path), str(readme_path), str(model_card_path), str(REGISTRY_PATH)]
        )

    return result


class _SpawnAgentRequestHandler(BaseHTTPRequestHandler):
    """HTTP handler that exposes a ``/spawn_agent`` endpoint."""

    server_version = "SpawnAgentHTTP/1.0"

    def _set_headers(self, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        self._set_headers(204)

    def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path.rstrip("/") != "/spawn_agent":
            self._set_headers(404)
            self.wfile.write(b"{}")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length) if content_length else b"{}"

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError as exc:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))
            return

        try:
            result = spawn_agent(
                name=payload["name"],
                base_model=payload["base_model"],
                description=payload.get("description", ""),
                domain=payload.get("domain", "general"),
                temperament=payload.get("temperament", "balanced"),
                traits=payload.get("traits", []),
                parent=payload.get("parent"),
                namespace=payload.get("namespace"),
                repo_name=payload.get("repo_name"),
                publish=payload.get("publish", True),
                dry_run=payload.get("dry_run", False),
                space_sdk=payload.get("space_sdk", "gradio"),
                private_space=payload.get("private_space", False),
                token=payload.get("token"),
            )
            status = 200
        except Exception as exc:  # pragma: no cover - defensive guard
            logging.exception("Failed to spawn agent")
            result = {"error": str(exc)}
            status = 500

        self._set_headers(status)
        self.wfile.write(json.dumps(result, indent=2).encode("utf-8"))


def _run_server(host: str, port: int) -> None:
    logging.info("Starting spawn agent server on %s:%s", host, port)
    server = HTTPServer((host, port), _SpawnAgentRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Server interrupted; shutting down")
    finally:
        server.server_close()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", help="Name for the new agent")
    parser.add_argument("--base-model", dest="base_model", help="Backbone model to use")
    parser.add_argument("--description", default="", help="Short description for the agent")
    parser.add_argument("--domain", default="general", help="Operational domain")
    parser.add_argument("--temperament", default="balanced", help="Agent temperament")
    parser.add_argument(
        "--traits",
        action="append",
        default=[],
        help="Trait to add to the agent (can be specified multiple times)",
    )
    parser.add_argument("--parent", help="Parent agent name or UUID", default=None)
    parser.add_argument(
        "--namespace", help="Hugging Face namespace (defaults to '<slug>-ai')", default=None
    )
    parser.add_argument(
        "--repo-name",
        dest="repo_name",
        help="Hugging Face repository name (defaults to domain slug)",
        default=None,
    )
    parser.add_argument(
        "--skip-publish", dest="publish", action="store_false", help="Do not publish"
    )
    parser.add_argument("--dry-run", action="store_true", help="Simulate without writing files")
    parser.add_argument("--space-sdk", default="gradio", help="Space SDK to use")
    parser.add_argument("--private-space", action="store_true", help="Create private Space")
    parser.add_argument("--token", help="Hugging Face token", default=None)
    parser.add_argument("--serve", action="store_true", help="Run an HTTP server")
    parser.add_argument("--host", default="127.0.0.1", help="Server host")
    parser.add_argument("--port", default=8000, type=int, help="Server port")
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Logging verbosity",
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(level=getattr(logging, args.log_level))

    if args.serve:
        _run_server(args.host, args.port)
        return 0

    missing = [field for field in ("name", "base_model") if not getattr(args, field)]
    if missing:
        parser.error(f"Missing required arguments: {', '.join(missing)}")

    result = spawn_agent(
        name=args.name,
        base_model=args.base_model,
        description=args.description,
        domain=args.domain,
        temperament=args.temperament,
        traits=args.traits,
        parent=args.parent,
        namespace=args.namespace,
        repo_name=args.repo_name,
        publish=args.publish,
        dry_run=args.dry_run,
        space_sdk=args.space_sdk,
        private_space=args.private_space,
        token=args.token,
    )

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(main())
