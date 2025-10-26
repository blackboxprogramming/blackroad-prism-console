from pathlib import Path

from fastapi.testclient import TestClient

from roadview.main import app


def main() -> None:
    client = TestClient(app)
    response = client.get("/openapi.json")
    response.raise_for_status()
    output_path = Path(__file__).resolve().parents[1] / "docs" / "roadview-openapi.json"
    output_path.write_text(response.text)


if __name__ == "__main__":
    main()
