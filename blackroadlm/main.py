"""CLI entrypoint for BlackroadLM."""
from __future__ import annotations

import argparse
from pathlib import Path


def _serve(args: argparse.Namespace) -> None:
    """Start the API server."""
    from .api import create_app
    import uvicorn

    uvicorn.run(create_app(), host=args.host, port=args.port)


def _chat(args: argparse.Namespace) -> None:
    """Open a terminal chat session for a persona.

    Currently this is a placeholder implementation.
    """
    print(f"[chat] Starting chat with persona '{args.persona}' (not implemented)")


def _list_items(args: argparse.Namespace) -> None:  # noqa: ARG001
    """List available models and personas."""
    models_dir = Path(__file__).parent / "models"
    personas_dir = Path(__file__).parent / "personas"

    if models_dir.exists():
        print("Models:")
        for model in models_dir.iterdir():
            print(f"- {model.name}")
    else:
        print("No models directory found")

    if personas_dir.exists():
        print("Personas:")
        for persona in personas_dir.glob("*.toml"):
            print(f"- {persona.stem}")
    else:
        print("No personas directory found")


def _pull(args: argparse.Namespace) -> None:
    """Download a model placeholder."""
    print(f"[pull] Downloading model '{args.model}' (not implemented)")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="BlackroadLM CLI")
    sub = parser.add_subparsers(dest="command")

    serve_p = sub.add_parser("serve", help="Start the API server")
    serve_p.add_argument("--host", default="0.0.0.0")
    serve_p.add_argument("--port", type=int, default=8000)
    serve_p.set_defaults(func=_serve)

    chat_p = sub.add_parser("chat", help="Open a chat with a persona")
    chat_p.add_argument("persona")
    chat_p.set_defaults(func=_chat)

    list_p = sub.add_parser("list", help="List models and personas")
    list_p.set_defaults(func=_list_items)

    pull_p = sub.add_parser("pull", help="Download a model")
    pull_p.add_argument("model")
    pull_p.set_defaults(func=_pull)

    return parser


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
