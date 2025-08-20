from datetime import datetime
from zoneinfo import ZoneInfo

def tool_get_time(payload: dict):
    tz = payload.get("timezone", "America/Chicago")
    return {"iso": datetime.now(ZoneInfo(tz)).isoformat(), "timezone": tz}

def tool_guardian_check(payload: dict):
    # Hook your Guardian logic here (policy / safety / contradiction gates).
    # Return concise flags only (no chain-of-thought).
    return {"ok": True, "flags": []}

TOOLS = [
    {
        "name": "get_time",
        "description": "Get current time in a given IANA timezone",
        "schema": {"type": "object", "properties": {"timezone": {"type": "string"}}, "required": []},
        "fn": tool_get_time,
    },
    {
        "name": "guardian_check",
        "description": "Run Lucidia Guardian policy & contradiction gates on the current request",
        "schema": {"type": "object", "properties": {}},
        "fn": tool_guardian_check,
    },
]
