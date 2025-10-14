"""FastAPI application serving the BlackRoad dashboard."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from agent.auth import TokenAuthMiddleware

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app = FastAPI(title="BlackRoad Dashboard", version="1.0.0")
app.add_middleware(TokenAuthMiddleware)


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request) -> HTMLResponse:
    """Render the dashboard UI."""
    return templates.TemplateResponse("dashboard.html", {"request": request})
import uvicorn

from agent import telemetry

app = FastAPI(title="BlackRoad Dashboard")
_templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(_templates_dir))

JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "pi": pi, "jetson": jetson},
    )


def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)
