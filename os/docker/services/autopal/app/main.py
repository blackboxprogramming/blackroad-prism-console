from fastapi import FastAPI

app = FastAPI(title="Autopal", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "autopal"}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Autopal stub running",
        "todo": "Integrate with actual Autopal FastAPI application",
    }
