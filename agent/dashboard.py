from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import uvicorn
from agent import telemetry, jobs

app = FastAPI(title="BlackRoad Dashboard")
templates = Jinja2Templates(directory="agent/templates")

JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "pi": pi, "jetson": jetson}
    )


@app.post("/run")
def run_job(command: str = Form(...)):
    jobs.run_remote(JETSON_HOST, command, user=JETSON_USER)
    return RedirectResponse("/", status_code=303)


def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)


if __name__ == "__main__":
    main()
