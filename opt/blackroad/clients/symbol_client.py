

import json, urllib.parse, urllib.request

BASE = "http://127.0.0.1:8087"

def resolve(name: str):
    url = f"{BASE}/v1/resolve?name={urllib.parse.quote(name)}"
    try:
        with urllib.request.urlopen(url, timeout=2) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e), "name": name}

def batch(names):
    data = json.dumps({"names": names}).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/v1/batch", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=3) as r:
        return json.loads(r.read().decode("utf-8"))
