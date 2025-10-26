from __future__ import annotations

import json
from pathlib import Path

from fastapi.encoders import jsonable_encoder

from roadview.main import app


def export_openapi() -> None:
    output_path = Path(__file__).resolve().parents[1] / "docs" / "roadview-openapi.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    output_path.write_text(json.dumps(jsonable_encoder(schema), indent=2), encoding="utf-8")
    print(f"OpenAPI schema exported to {output_path}")


if __name__ == "__main__":
    export_openapi()
