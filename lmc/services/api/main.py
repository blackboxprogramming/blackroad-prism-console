from fastapi import FastAPI

app = FastAPI(title="LMC API")


@app.get("/health")
def health() -> dict[str, str]:
    """Simple health check."""
    return {"status": "ok"}


@app.get("/schemas")
def list_schemas() -> list[dict]:
    """Return available metadata schemas.

    The implementation is a placeholder; in the future this will query the
    schema registry stored in Postgres.
    """
    return []


@app.post("/schemas")
def create_schema(schema: dict) -> dict:
    """Store a new metadata schema.

    This endpoint performs no validation yet; it merely echoes the payload.
    """
    return schema
