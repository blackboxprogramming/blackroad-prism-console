from __future__ import annotations

import json
from pathlib import Path

from prism.main import app


def main() -> None:
    output = Path("docs")
    output.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    output_file = output / "prism-openapi.json"
    output_file.write_text(json.dumps(schema, indent=2))
    print(f"Exported OpenAPI schema to {output_file}")


if __name__ == "__main__":
    main()
