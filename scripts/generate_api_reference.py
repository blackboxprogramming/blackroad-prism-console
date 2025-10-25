from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import importlib.util

from fastapi.openapi.utils import get_openapi


def render_markdown(spec: Dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# API Reference")
    lines.append("")
    lines.append(f"_Generated {datetime.now(timezone.utc).isoformat()}Z_\n")

    paths = spec.get("paths", {})
    for path, methods in sorted(paths.items()):
        lines.append(f"## `{path}`")
        for method, meta in sorted(methods.items()):
            method_upper = method.upper()
            summary = meta.get("summary") or meta.get("operationId") or ""
            description = meta.get("description") or ""
            lines.append(f"### {method_upper}")
            if summary:
                lines.append(f"- **Summary:** {summary}")
            if description:
                lines.append(f"- **Description:** {description.strip()}")

            security = meta.get("security") or []
            if security:
                schemes = [", ".join(item.keys()) for item in security]
                lines.append(f"- **Security:** {', '.join(schemes)}")

            if "requestBody" in meta:
                content = meta["requestBody"].get("content", {})
                types = ", ".join(content.keys())
                lines.append(f"- **Request Body:** {types or 'n/a'}")

            responses = meta.get("responses", {})
            if responses:
                lines.append("- **Responses:**")
                for code, response in responses.items():
                    desc = response.get("description", "")
                    lines.append(f"  - `{code}` {desc}")

            lines.append("")
    return "\n".join(lines).strip() + "\n"


def main() -> None:
    app = load_fastapi_app()
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    markdown = render_markdown(openapi_schema)
    output = Path("docs/API_REFERENCE.md")
    output.write_text(markdown, encoding="utf-8")
    print(f"Wrote {output}")


def load_fastapi_app():
    root = Path(__file__).resolve().parent.parent
    import sys
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))
    module_path = root / "app.py"
    spec = importlib.util.spec_from_file_location("ai_console_app", module_path)
    if not spec or not spec.loader:  # pragma: no cover - sanity guard
        raise RuntimeError("unable to load app module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.create_app()


if __name__ == "__main__":
    main()
