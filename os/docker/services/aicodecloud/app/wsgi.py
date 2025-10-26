from flask import Flask

app = Flask(__name__)


@app.route("/")
def index() -> tuple[dict[str, str], int]:
    return {"message": "AICodeCloud stub", "todo": "Replace with real Flask application"}, 200


@app.route("/api/health")
def api_health() -> tuple[dict[str, str], int]:
    return {"status": "ok", "service": "aicodecloud"}, 200


@app.route("/health")
def health() -> tuple[dict[str, str], int]:
    return {"status": "ok", "service": "aicodecloud"}, 200
