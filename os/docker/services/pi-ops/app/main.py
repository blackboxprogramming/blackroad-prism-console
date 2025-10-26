import logging
import os

from fastapi import FastAPI

app = FastAPI(title="Pi Ops", version="0.1.0")
logger = logging.getLogger("pi-ops")
logging.basicConfig(level=logging.INFO)

MQTT_URL = os.environ.get("MQTT_URL", "mqtt://mqtt:1883")


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting Pi-Ops stub with MQTT broker %s", MQTT_URL)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "pi-ops"}


@app.get("/")
async def index() -> dict[str, str]:
    return {
        "message": "Pi-Ops stub server",
        "mqtt": MQTT_URL,
        "todo": "Integrate with real Pi operations FastAPI app",
    }
