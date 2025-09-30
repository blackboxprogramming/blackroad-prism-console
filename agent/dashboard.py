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
