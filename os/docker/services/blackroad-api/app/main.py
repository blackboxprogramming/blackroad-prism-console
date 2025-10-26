from fastapi import FastAPI

app = FastAPI(title="BlackRoad API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "blackroad-api"}


@app.get("/api/health")
def prefixed_health() -> dict[str, str]:
    return {"status": "ok", "service": "blackroad-api"}


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "BlackRoad API stub", "todo": "Replace with real service implementation"}
