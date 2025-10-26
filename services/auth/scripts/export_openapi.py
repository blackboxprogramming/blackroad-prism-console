from __future__ import annotations

import json
from pathlib import Path

from auth.main import create_app


def main() -> None:
    app = create_app()
    schema = app.openapi()
    output = Path(__file__).resolve().parents[1] / "docs" / "auth-openapi.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(schema, indent=2))


if __name__ == "__main__":
    main()
