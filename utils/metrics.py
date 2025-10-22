import json, os, time
METRICS_PATH = os.path.join('artifacts','metrics.json')
os.makedirs('artifacts', exist_ok=True)

def emit(name: str, value=1):
    data = {}
    if os.path.exists(METRICS_PATH):
        try:
            data = json.load(open(METRICS_PATH))
        except Exception:
            data = {}
    data[name] = data.get(name, 0) + value
    data['last_updated'] = int(time.time())
    with open(METRICS_PATH,'w') as f: json.dump(data, f, indent=2, sort_keys=True)
